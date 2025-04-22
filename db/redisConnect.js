import Redis from "ioredis";

// Подключение к Redis (локально)
const redis = new Redis({
  host: "127.0.0.1",
  port: 6379,
});

redis.on("connect", () => console.log("🔗 Подключено к Redis"));
// redis.on("error", (err) => console.error("❌ Ошибка Redis:", err));
redis.on("error", () => {});

export default redis;
