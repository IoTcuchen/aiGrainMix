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
      script: "/home/ubuntu/aiGrainMix/agent/start_agent.sh",
      interpreter: "bash",
    },
  ],
};
