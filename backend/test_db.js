const { createClient } = require('@libsql/client');

async function test() {
  const client = createClient({
    url: "libsql://student-db-khan7250.aws-us-east-2.turso.io",
    authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzU2Nzc2MzYsImlkIjoiMDE5ZDZlYTEtODQwMS03OTUwLTgyNzUtNjU0MGIzM2ZhZTllIiwicmlkIjoiMTZkZTkxNWMtYTc2Ny00YmI4LWExMDUtMDM0MTE1MDNjNGYxIn0.g97-7tb4GZhEX64h-lorowu-apLc7Q6E1wiBtDGsz8iLXNAL_WHpz8b9TZN95339hyH3-ZllmPuLf9PtRkwZAg"
  });

  try {
    const res = await client.execute("PRAGMA table_info(Students)");
    console.log("Table columns:");
    console.log(res.rows);
  } catch (e) {
    console.error(e);
  }
}
test();
