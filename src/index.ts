import express from "express";
import routes from "./routes/index.js";
import { PORT } from "./config/constants.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(routes);

app.listen(PORT, () => {
    console.log(`Auth Server is running on port ${PORT}`);
});

export default app;