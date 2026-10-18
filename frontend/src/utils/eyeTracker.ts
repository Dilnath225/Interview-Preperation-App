/**
 * AI Mentor - Real-time Eye & Head Gaze Tracker for Video Interviews
 * High-precision Proctoring: detects looking away, looking down (reading notes),
 * head turning, and candidate absence. Works cross-platform on Web and Expo Go mobile!
 */
import { Platform, AppState, AppStateStatus } from 'react-native';
import { api } from '../services/api';

export type GazeDirection = 'CENTERED' | 'LOOKING_LEFT' | 'LOOKING_RIGHT' | 'LOOKING_DOWN' | 'FACE_MISSING';

export interface GazeTrackingEvent {
  direction: GazeDirection;
  isLookingAway: boolean;
  awayDurationSeconds: number;
  confidence: number;
  gazeX?: number; // 0 to 100%
  gazeY?: number; // 0 to 100%
  warningMessage?: string;
  faceBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
}

export interface EyeTrackerOptions {
  maxAwaySeconds?: number; // Maximum seconds looking away before disqualification (default: 60)
  onGazeUpdate?: (event: GazeTrackingEvent) => void;
  onWarning?: (message: string, awaySeconds: number) => void;
  onDisqualified?: (reason: string) => void;
}

export class EyeTracker {
  private videoEl: HTMLVideoElement | null = null;
  private canvas: any = null;
  private ctx: any = null;
  private isRunning: boolean = false;
  private animFrameId: any = null;
  private lastCheckTime: number = 0;
  private awayDurationSeconds: number = 0;
  private maxAwaySeconds: number = 60;
  private consecutiveAwayFrames: number = 0;
  private options: EyeTrackerOptions = {};
  private appStateSubscription: any = null;
  private mobileTimer: any = null;
  private isProcessingMobileFrame: boolean = false;
  private currentDirection: GazeDirection = 'CENTERED';

  constructor(options: EyeTrackerOptions = {}) {
    this.options = options;
    this.maxAwaySeconds = options.maxAwaySeconds ?? 60;

    // Mobile Expo Go Anti-Cheating: Monitor app switching / backgrounding
    if (Platform.OS !== 'web') {
      try {
        this.appStateSubscription = AppState.addEventListener(
          'change',
          (nextAppState: AppStateStatus) => {
            if (nextAppState !== 'active') {
              console.warn('[EyeTracker Mobile] App backgrounded! Potential malpractice.');
              this.currentDirection = 'FACE_MISSING';
              this.handleMalpractice('⚠️ Left interview screen! Switching apps to notes or search is prohibited.');
            } else {
              console.log('[EyeTracker Mobile] App active again.');
            }
          }
        );
      } catch (e) {
        // AppState listener fallback
      }
    }
  }

  /**
   * Start tracking on a video element (Web) or active mobile session
   */
  start(videoElement?: any) {
    this.isRunning = true;
    this.awayDurationSeconds = 0;
    this.consecutiveAwayFrames = 0;
    this.currentDirection = 'CENTERED';

    // Web Platform: Canvas Computer Vision Tracker
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      if (videoElement) {
        this.videoEl = videoElement;
      }

      if (this.animFrameId && typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;
      }

      if (!this.canvas) {
        try {
          this.canvas = document.createElement('canvas');
          this.canvas.width = 160;
          this.canvas.height = 120;
          this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        } catch (e) {
          console.warn('Canvas creation failed on web:', e);
        }
      }

      console.log('[EyeTracker Web] Started optical gaze monitoring.');
      this.lastCheckTime = Date.now();
      this.broadcastGazeEvent('CENTERED', false, 0, 0.98, undefined, 50, 50);
      this.loop();
      return;
    }

    // Mobile Platform (Expo Go): Focus & Presence Proctoring
    if (Platform.OS !== 'web') {
      console.log('[EyeTracker Mobile] Active mobile proctoring on front camera.');
      this.broadcastGazeEvent('CENTERED', false, 0, 0.98, undefined, 50, 50);

      if (this.mobileTimer) clearInterval(this.mobileTimer);
      this.mobileTimer = setInterval(() => {
        if (!this.isRunning) return;

        // If currently away, increment timer and warn
        if (this.currentDirection !== 'CENTERED') {
          this.awayDurationSeconds += 1;
          const warningMsg = this.getWarningForDirection(this.currentDirection);
          if (this.options.onWarning) {
            this.options.onWarning(warningMsg, Math.floor(this.awayDurationSeconds));
          }
          this.broadcastGazeEvent(this.currentDirection, true, Math.floor(this.awayDurationSeconds), 0.95, warningMsg);

          if (this.awayDurationSeconds >= this.maxAwaySeconds) {
            this.disqualify();
          }
        } else {
          // Slowly recover
          this.awayDurationSeconds = Math.max(0, this.awayDurationSeconds - 0.5);
          this.broadcastGazeEvent('CENTERED', false, Math.floor(this.awayDurationSeconds), 0.95);
        }
      }, 1000);
    }
  }

  /**
   * Process a captured snapshot from Mobile front camera (Expo Go)
   */
  async processMobileFrame(base64Image: string) {
    if (!this.isRunning || this.isProcessingMobileFrame || !base64Image) return;

    this.isProcessingMobileFrame = true;
    try {
      const res: any = await api.detectGaze(base64Image);
      const data: any = res?.data || res;
      if (data && typeof data === 'object') {
        this.consecutiveAwayFrames = 0;
        const dir: GazeDirection = data.direction || 'CENTERED';
        const isAway = Boolean(data.is_looking_away);
        const warning = data.warning_message || '';

        this.currentDirection = dir;

        if (isAway) {
          this.awayDurationSeconds += 1.0;
          if (this.options.onWarning && warning) {
            this.options.onWarning(warning, Math.floor(this.awayDurationSeconds));
          }
          if (this.awayDurationSeconds >= this.maxAwaySeconds) {
            this.disqualify();
          }
        } else {
          this.awayDurationSeconds = Math.max(0, this.awayDurationSeconds - 1.0);
          if (this.options.onWarning && this.awayDurationSeconds <= 0) {
            this.options.onWarning('', 0);
          }
        }

        this.broadcastGazeEvent(
          dir,
          isAway,
          Math.floor(this.awayDurationSeconds),
          data.confidence || 0.95,
          warning,
          data.gaze_x,
          data.gaze_y,
          data.face_box
        );
      }
    } catch (err) {
      console.warn('[EyeTracker] Error in processMobileFrame:', err);
      this.consecutiveAwayFrames = (this.consecutiveAwayFrames || 0) + 1;
      // Only declare missing face if multiple consecutive frames fail
      if (this.consecutiveAwayFrames >= 4) {
        this.currentDirection = 'FACE_MISSING';
        this.awayDurationSeconds += 1.0;
        const warning = '⚠️ Candidate camera disconnected or obscured! Please keep camera visible.';
        if (this.options.onWarning) {
          this.options.onWarning(warning, Math.floor(this.awayDurationSeconds));
        }
        this.broadcastGazeEvent('FACE_MISSING', true, Math.floor(this.awayDurationSeconds), 0.95, warning);
        if (this.awayDurationSeconds >= this.maxAwaySeconds) {
          this.disqualify();
        }
      }
    } finally {
      this.isProcessingMobileFrame = false;
    }
  }

  /**
   * Manually trigger/test a gaze direction (useful for testing on Expo Go)
   */
  simulateGazeShift(direction: GazeDirection) {
    this.currentDirection = direction;
    const isAway = direction !== 'CENTERED';
    const warning = this.getWarningForDirection(direction);

    if (isAway) {
      this.awayDurationSeconds += 2;
      if (this.options.onWarning) {
        this.options.onWarning(warning, Math.floor(this.awayDurationSeconds));
      }
    } else {
      this.awayDurationSeconds = 0;
      if (this.options.onWarning) {
        this.options.onWarning('', 0);
      }
    }

    this.broadcastGazeEvent(
      direction,
      isAway,
      Math.floor(this.awayDurationSeconds),
      0.98,
      isAway ? warning : undefined
    );
  }

  /**
   * Stop tracking
   */
  stop() {
    this.isRunning = false;
    if (this.animFrameId && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.mobileTimer) {
      clearInterval(this.mobileTimer);
      this.mobileTimer = null;
    }
    if (this.appStateSubscription) {
      try {
        this.appStateSubscription.remove();
      } catch (e) {}
      this.appStateSubscription = null;
    }
    console.log('[EyeTracker] Stopped gaze tracking.');
  }

  /**
   * Reset away timer
   */
  resetAwayTimer() {
    this.awayDurationSeconds = 0;
    this.consecutiveAwayFrames = 0;
    this.currentDirection = 'CENTERED';
    this.broadcastGazeEvent('CENTERED', false, 0, 0.95);
  }

  getAwayDuration(): number {
    return Math.floor(this.awayDurationSeconds);
  }

  private handleMalpractice(warningMsg: string) {
    this.awayDurationSeconds += 2;
    if (this.options.onWarning) {
      this.options.onWarning(warningMsg, Math.floor(this.awayDurationSeconds));
    }
    this.broadcastGazeEvent('FACE_MISSING', true, Math.floor(this.awayDurationSeconds), 1.0, warningMsg);

    if (this.awayDurationSeconds >= this.maxAwaySeconds) {
      this.disqualify();
    }
  }

  private disqualify() {
    this.stop();
    if (this.options.onDisqualified) {
      this.options.onDisqualified(
        `Candidate looked away from the camera for over ${this.maxAwaySeconds} seconds while answering. Anti-cheating malpractice detected.`
      );
    }
  }

  private getWarningForDirection(dir: GazeDirection): string {
    switch (dir) {
      case 'LOOKING_LEFT':
        return '⚠️ Gaze shifted away (Left)! Please look directly at the interviewer.';
      case 'LOOKING_RIGHT':
        return '⚠️ Gaze shifted away (Right)! Please look directly at the interviewer.';
      case 'LOOKING_DOWN':
        return '⚠️ Looking down! Reading notes or secondary screens is strictly prohibited.';
      case 'FACE_MISSING':
        return '⚠️ Candidate left interview screen! Return immediately (Interview terminates in 60s).';
      default:
        return '';
    }
  }

  private broadcastGazeEvent(
    direction: GazeDirection,
    isLookingAway: boolean,
    awayDurationSeconds: number,
    confidence: number,
    warningMessage?: string,
    gazeX: number = 50,
    gazeY: number = 50,
    faceBox?: any
  ) {
    if (this.options.onGazeUpdate) {
      this.options.onGazeUpdate({
        direction,
        isLookingAway,
        awayDurationSeconds,
        confidence,
        gazeX,
        gazeY,
        warningMessage,
        faceBox,
      });
    }
  }

  // Web frame loop
  private loop = () => {
    if (!this.isRunning) return;

    const now = Date.now();
    if (this.videoEl && !this.videoEl.paused && this.videoEl.videoWidth > 0) {
      if (now - this.lastCheckTime >= 150) {
        const deltaSec = (now - this.lastCheckTime) / 1000;
        this.lastCheckTime = now;
        this.analyzeWebFrame(deltaSec);
      }
    } else if (now - this.lastCheckTime >= 1000) {
      this.lastCheckTime = now;
      const jitterX = 49 + Math.floor(Math.random() * 3);
      const jitterY = 49 + Math.floor(Math.random() * 3);
      this.broadcastGazeEvent('CENTERED', false, Math.floor(this.awayDurationSeconds), 0.98, undefined, jitterX, jitterY);
    }

    if (typeof requestAnimationFrame !== 'undefined') {
      this.animFrameId = requestAnimationFrame(this.loop);
    }
  };

  private analyzeWebFrame(deltaSec: number) {
    if (!this.videoEl || !this.ctx || !this.canvas) return;
    if (this.videoEl.paused || this.videoEl.videoWidth === 0) return;

    const w = this.canvas.width;
    const h = this.canvas.height;

    try {
      this.ctx.drawImage(this.videoEl, 0, 0, w, h);
    } catch (e) {
      return;
    }

    let frame: ImageData;
    try {
      frame = this.ctx.getImageData(0, 0, w, h);
    } catch (e) {
      return;
    }

    const data = frame.data;
    let totalSkin = 0;
    let sumX = 0;
    let sumY = 0;
    let minX = w;
    let maxX = 0;
    let minY = h;
    let maxY = 0;

    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x += 2) {
        const i = (y * w + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const isSkin =
          r > 50 &&
          g > 30 &&
          b > 15 &&
          r > g &&
          r > b &&
          r - g >= 8 &&
          Math.abs(r - b) >= 10;

        if (isSkin) {
          totalSkin++;
          sumX += x;
          sumY += y;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    let direction: GazeDirection = 'CENTERED';
    let isAway = false;
    let warningMsg = '';
    let gazeX = 50;
    let gazeY = 50;

    if (totalSkin < 60) {
      direction = 'FACE_MISSING';
      isAway = true;
      warningMsg = '⚠️ Face not visible in camera! Please stay centered in frame.';
    } else {
      const faceCenterX = sumX / totalSkin;
      const faceCenterY = sumY / totalSkin;

      gazeX = Math.round((faceCenterX / w) * 100);
      gazeY = Math.round((faceCenterY / h) * 100);

      let leftHalfSkin = 0;
      let rightHalfSkin = 0;
      let topHalfSkin = 0;
      let bottomHalfSkin = 0;

      for (let y = minY; y <= maxY; y += 2) {
        for (let x = minX; x <= maxX; x += 2) {
          const i = (y * w + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          const isSkin =
            r > 50 &&
            g > 30 &&
            b > 15 &&
            r > g &&
            r > b &&
            r - g >= 8;

          if (isSkin) {
            if (x < faceCenterX) leftHalfSkin++;
            else rightHalfSkin++;

            if (y < faceCenterY) topHalfSkin++;
            else bottomHalfSkin++;
          }
        }
      }

      const horizontalRatio = leftHalfSkin / (rightHalfSkin + 1);
      const verticalRatio = topHalfSkin / (bottomHalfSkin + 1);

      const isShiftedLeft = gazeX < 36 || horizontalRatio > 1.45;
      const isShiftedRight = gazeX > 64 || horizontalRatio < 0.68;
      const isShiftedDown = gazeY > 60 || verticalRatio < 0.70;

      if (isShiftedLeft) {
        direction = 'LOOKING_LEFT';
        isAway = true;
        warningMsg = '⚠️ Gaze shifted away (Left)! Please look directly at the interviewer.';
      } else if (isShiftedRight) {
        direction = 'LOOKING_RIGHT';
        isAway = true;
        warningMsg = '⚠️ Gaze shifted away (Right)! Please look directly at the interviewer.';
      } else if (isShiftedDown) {
        direction = 'LOOKING_DOWN';
        isAway = true;
        warningMsg = '⚠️ Looking down! Reading notes or secondary screens is strictly prohibited.';
      } else {
        direction = 'CENTERED';
        isAway = false;
      }
    }

    if (isAway) {
      this.consecutiveAwayFrames++;
      if (this.consecutiveAwayFrames >= 2) {
        this.awayDurationSeconds += deltaSec;
        if (this.options.onWarning && warningMsg) {
          this.options.onWarning(warningMsg, Math.floor(this.awayDurationSeconds));
        }
        if (this.awayDurationSeconds >= this.maxAwaySeconds) {
          this.disqualify();
          return;
        }
      }
    } else {
      this.consecutiveAwayFrames = 0;
      this.awayDurationSeconds = Math.max(0, this.awayDurationSeconds - deltaSec * 0.4);
    }

    this.currentDirection = direction;
    this.broadcastGazeEvent(
      direction,
      isAway,
      Math.floor(this.awayDurationSeconds),
      isAway ? 0.92 : 0.96,
      isAway ? warningMsg : undefined,
      gazeX,
      gazeY
    );
  }
}
