#!/usr/bin/env bash
set -e
cd /home/ubuntu/aiGrainMix/agent
source venv/bin/activate
exec python api/index.py
