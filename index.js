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

// auth related routes
require('./routes/auth/auth.routes')(app)
// attendance related routes
require('./routes/attendance/attendance.routes')(app)
// user account related routes
require('./routes/account/account.routes')(app)
// leave related routes
require('./routes/leave/leave.routes')(app)
// department related routes
require('./routes/settings-info/department/department.routes')(app)


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
