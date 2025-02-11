import mysql from 'mysql2/promise';

export default async function requestToDB(request) {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'central_enpf'
    });

    const [rows] = await connection.execute(request); // Извлекаем только данные
    return rows;
  } catch (error) {
    console.error('Ошибка выполнения запроса:', error);
    throw error;
  } finally {
    if (connection) await connection.end(); // Проверяем, есть ли соединение перед закрытием
  }
}
