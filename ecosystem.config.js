module.exports = {
  apps: [
    {
      name: "web_app",
      cwd: "/home/ubuntu/aiGrainMix/web",
      script: "npm",
      args: "run start",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
    {
      name: "ai_agent",
      cwd: "/home/ubuntu/aiGrainMix/agent",
      script: "api/index.py",
      interpreter: "/home/ubuntu/aiGrainMix/agent/venv/bin/python",
    },
  ],
};
