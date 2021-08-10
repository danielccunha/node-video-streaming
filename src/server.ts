import express from "express";
import morgan from "morgan";
import chalk from "chalk";

import { routes } from "./routes";

const app = express();
const port = process.env.PORT || 3333;

app.use(morgan("dev"));
app.use(routes);

app.listen(port, () => {
  console.log(`Server is running on port ${chalk.yellow(port)}`);
});
