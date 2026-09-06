#!/usr/bin/env python3
import pathlib
import re
import subprocess
import sys


PATTERNS = {
    "Supabase secret key": re.compile(r"sb_secret_[A-Za-z0-9_-]{20,}"),
    "GitHub token": re.compile(r"gh[pousr]_[A-Za-z0-9]{30,}"),
    "AWS access key": re.compile(r"AKIA[0-9A-Z]{16}"),
    "Stripe live key": re.compile(r"sk_live_[A-Za-z0-9]{20,}"),
    "service_role JWT": re.compile(r"eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+"),
}


def repository_files() -> list[pathlib.Path]:
    output = subprocess.check_output(
        ["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z"]
    )
    return [pathlib.Path(item.decode()) for item in output.split(b"\0") if item]


def main() -> int:
    findings: list[tuple[str, str]] = []
    for path in repository_files():
        if path.name.startswith(".env") and not path.name.endswith(".example"):
            findings.append((str(path), "tracked environment file"))
            continue
        try:
            content = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        for label, pattern in PATTERNS.items():
            if pattern.search(content):
                findings.append((str(path), label))

    if findings:
        for path, label in findings:
            print(f"Secret scan failed: {path} ({label})")
        return 1
    print("Secret scan passed: no known credential pattern in repository files.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
