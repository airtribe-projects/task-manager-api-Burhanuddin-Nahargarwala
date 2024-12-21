require('dotenv').config()
const express = require('express');
const fs = require("fs");
const app = express();
const port = process.env.PORT || 3000;


const logger = (req, res, next) => {
    console.log(`${req.method}: Request received on ${req.url}`);
    next();
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger)

// Utility Functions
const readTasksFile = () => {
    try {
        const data = fs.readFileSync('./task.json', 'utf-8', (err, data) => {
            if (err) {
                console.log(err)
                throw err;
            }
        });

        return JSON.parse(data).tasks;
    } catch (err) {
        throw new Error('Error reading tasks file');
    }
};

const writeTasksFile = (tasks) => {
    try {
        fs.writeFile('./task.json', JSON.stringify({ tasks }, null, 2), (err, data) => {
            if (err) {
                console.log(err)
                throw err;
            }
        });

    } catch (err) {
        throw new Error('Error writing to tasks file');
    }
};


const isValidTask = (task) => {
    // Check if required keys exist and have the correct data types
    return (
        task.hasOwnProperty('title') && typeof task.title === 'string' &&
        task.hasOwnProperty('description') && typeof task.description === 'string' &&
        task.hasOwnProperty('completed') && typeof task.completed === 'boolean'
    );
}


app.get("/", (req, res) => {
    res.send({ "message": "Welcome to Tasks API!" })
})


app.get("/api/v1/tasks", (req, res) => {
    try {
        const tasks = readTasksFile();
        res.send(tasks);
    } catch (err) {
        console.log(err);
        res.status(500).send({ message: 'Unable to fetch tasks!' });
    }
})


app.get("/api/v1/tasks/:id", (req, res) => {

    const id = parseInt(req.params.id);
    try {
        const tasks = readTasksFile();
        const task = tasks.find((task) => task.id == id);
        if (!task) {
            res.status(404).send({ "message": "Task not found!" });
        }

        res.send(task);
    } catch (err) {
        console.log(err);
        res.status(500).send({ message: "Unable to fetch task!" });
    }
})


app.post("/api/v1/tasks", (req, res) => {
    const task = req.body;

    if (!isValidTask(task)) {
        return res.status(400).send({ "message": "The data is invalid!" })
    }

    try {
        const tasks = readTasksFile();
        task.id = tasks.length + 1
        tasks.push(task)

        // write a file
        writeTasksFile(tasks);
        res.status(201).send({ "message": "Task Successfully Created!" });
    } catch (err) {
        console.log(err);
        res.status(500).send({ message: "Unable to add task!" });
    }
})


app.put("/api/v1/tasks/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const updatedTask = req.body;

    if (!isValidTask(updatedTask)) {
        return res.status(400).send({ "message": "The data is invalid!" })
    }

    try {
        const tasks = readTasksFile();
        const taskIndex = tasks.findIndex(task => task.id == id);

        if (taskIndex === -1) {
            return res.status(404).send({ message: "Task not found!" });
        }

        // Update the task
        tasks[taskIndex] = { ...tasks[taskIndex], ...updatedTask };
        writeTasksFile(tasks);
        res.status(200).send({ message: "Tasks updated successfully!" })

    } catch (err) {
        console.log(err);
        res.status(500).send({ message: "Unable to update task!" })
    }

})


app.delete("/api/v1/tasks/:id", (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const tasks = readTasksFile();
        const taskIndex = tasks.findIndex(task => task.id == id);
        if (taskIndex === -1) {
            return res.status(404).send({ message: "Task not found!" });
        }

        // const remainingTasks = tasks.filter((task) => task.id != id)

        // remove the element
        tasks.splice(taskIndex, 1);

        // update remaining tasks
        writeTasksFile(tasks);
        res.status(200).send({ message: "Task successfully deleted!!" })
    } catch (err) {
        console.log(err);
        res.status(500).send({ message: "Unable to delete the task!" })
    }
})


app.listen(port, (err) => {
    if (err) {
        return console.log('Something bad happened', err);
    }
    console.log(`Server is listening on ${port}`);
});



module.exports = app;