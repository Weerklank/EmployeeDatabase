const inquirer = require("inquirer");
const prompt = inquirer.createPromptModule();
const sql = require("mysql")
const table = require("console.table")
const util = require("util")

const connection = sql.createConnection({
    host: "localhost",
    user: "root",
    password: "Wheat469",
    database: "employees"
});

connection.connect()

connection.query = util.promisify(connection.query)

askQuestions()
async function askQuestions() {
    const ans = await prompt([{
        type: "list",
        name: "initial",
        message: "What would you like to do?",
        choices: ["View All Employees", "View All Employees By Department", "View All Employees By Manager", "Add Employee", "Remove Employee", "Update Employee Role", "Update Employee Manager", "View All Roles", "Add Role", "Remove Role", "View All Dpertments", "Add Department", "Remove Department", "Exit"]
    }])
    switch (ans.initial) {
        case "View All Employees":
            connection.query(
                "SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name AS department, role.salary, CONCAT(manager.first_name, ' ', manager.last_name) AS manager FROM employee LEFT JOIN role on employee.role_id = role.id LEFT JOIN department on role.department_id = department.id LEFT JOIN employee manager on manager.id = employee.manager_id;",
                function (err, res) {
                    if (err) throw err
                    console.table(res)
                })
            break
        case "View All Employees By Department":
            connection.query(
                "SELECT department.id, department.name, SUM(role.salary) AS utilized_budget FROM employee LEFT JOIN role on employee.role_id = role.id LEFT JOIN department on role.department_id = department.id GROUP BY department.id, department.name;",
                function (err, res) {
                    if (err) throw err
                    let depts = res
                    return depts
                })
            await prompt({
                type: "list",
                name: "dept",
                message: "Which department are you looking for?",
                choices: depts
            })
            connection.query(
                "SELECT employee.id, employee.first_name, employee.last_name, role.title FROM employee LEFT JOIN role on employee.role_id = role.id LEFT JOIN department department on role.department_id = department.id WHERE department.id = ?;",
                departmentId
            );
            break
        case "View All Employees By Manager":
            break
        case "Add Employee":
            let info = null;
            get_info("SELECT * from department", async function (result) {
                info = result;
                const depts = info.map(x => x.name);
                console.log(depts)
                let employee = await prompt([{
                    type: "input",
                    name: "first_name",
                    message: "What is the first name of the employee?"
                },
                {
                    type: "input",
                    name: "last_name",
                    message: "What is the last name of the employee?"
                },
                {
                    type: "list",
                    name: "department",
                    message: "What department does the employee occupy?",
                    choices: depts
                }])
                let deptObj = info.filter(x => {
                    return x.name === employee.department
                })
                let deptId = deptObj[0].id
                get_info(`SELECT * from role WHERE department === ${deptId}`, async function (result) {
                    await prompt(
                        {
                            type: "input",
                            name: "role",
                            message: "What role does the employee occupy?"
                        }
                    )
                })
            })
            break
        case "Remove Employee":
            break
        case "Update Employee Role":
            break
        case "Update Employee Manager":
            break
        case "View All Roles":
            break
        case "Add Role":
            break
        case "Remove Role":
            break
        case "View All Dpertments":
            break
        case "Add Department":
            break
        case "Remove Department":
            break
        case "Exit":
            break
    }
}

async function get_info(sql, callback) {
    connection.query(sql, function (err, res) {
        if (err) throw err;
        info = res
        return callback(info);
    })
}
// class DB {
//     constructor(connection) {
//         this.connection = connection;
//     }


// }