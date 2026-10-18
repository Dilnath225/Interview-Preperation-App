#!/usr/bin/env python3
"""
AI Mentor - One-Click Selenium QA Automation Test Runner
Executes all end-to-end browser tests and generates an interactive HTML report.
"""
import sys
import subprocess
import os

# Ensure UTF-8 output on Windows consoles
if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

def main():
    print("=" * 60)
    print("[*] AI MENTOR - SELENIUM QA AUTOMATION TEST RUNNER")
    print("=" * 60)

    # Ensure reports directory exists
    os.makedirs("reports/screenshots", exist_ok=True)

    # Command to run pytest with html report
    cmd = [
        sys.executable,
        "-m",
        "pytest",
        "tests",
        "-v",
        "--html=reports/qa_report.html",
        "--self-contained-html",
    ]

    print(f"Running command: {' '.join(cmd)}\n")
    result = subprocess.run(cmd)

    print("\n" + "=" * 60)
    if result.returncode == 0:
        print("[OK] ALL QA AUTOMATION TESTS PASSED!")
    else:
        print("[!] SOME TESTS COMPLETED WITH WARNINGS/FAILURES. CHECK REPORT FOR DETAILS.")

    report_path = os.path.abspath("reports/qa_report.html")
    print(f"Detailed HTML Report: file:///{report_path.replace(os.sep, '/')}")
    print("=" * 60)

    sys.exit(result.returncode)

if __name__ == "__main__":
    main()
