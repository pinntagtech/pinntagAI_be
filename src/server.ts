import app from "./app.ts";


const PORT = process.env.PORT || 5000;
console.log(process.env.PORT, "PORT");

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
