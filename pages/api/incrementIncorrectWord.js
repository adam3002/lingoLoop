import mysql from "mysql2/promise";

import { validateToken } from "../../utils/validateToken";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      // Create a connection to the MySQL database
      const connection = await mysql.createConnection({
        host: "host.docker.internal",
        user: "root",
        password: "password",
        database: "lingoLoop",
      });

      // validate user
      const validateResponse = await validateToken(req);

      if (!validateResponse.valid) {
        return res.status(500).json({
          error: validateResponse.error,
        });
      }
      const { userId } = validateResponse;

      const { id } = req.query;
      const { count } = req.query;

      if (count === "3") {
        // remove from list
        connection.execute(
          "DELETE FROM incorrectWords WHERE id = ? AND userId = ?",
          [id, userId],
        );
      } else {
        const updateQuery = `UPDATE incorrectWords SET count = ${count} WHERE id = ${id}`;

        await connection.execute(updateQuery);
        // update counter
      }

      const [incorrectRows] = await connection.execute(
        "SELECT * FROM incorrectWords WHERE userId = ?",
        [userId],
      );

      res.status(200).json(incorrectRows);
      await connection.end();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Database error" });
    }
  } else {
    // If not a GET request, return method not allowed
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
