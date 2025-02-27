import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config(); // Загружаем переменные из .env

export default async function requestToDB(request) {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      charset: process.env.DB_CHARSET
    });

    const [rows] = await connection.execute(request);
    return rows;
  } catch (error) {
    console.error('Ошибка выполнения запроса:', error);
    throw error;
  } finally {
    if (connection) await connection.end();
  }
}
