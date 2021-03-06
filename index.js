require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");

const app = express();

app.use(express.json({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("tiny"));

app.use(
    cors({
        origin: "*",
    })
);

// user routes
require('./routes/user.route')(app)

app.get("/", (req, res) => {
    return res.send({ message: "Welcome" });
});

mongoose
    .connect(process.env.CONNECTION_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() =>
        app.listen(process.env.PORT, () =>
            console.log(
                `Server running on: http://localhost:${process.env.PORT}`
            )
        )
    )
    .catch((error) => console.log(error));
