const inquirer = require("inquirer");
const prompt = inquirer.createPromptModule();
const sql = require("mysql")
const table = require("console.table")
const util = require("util");

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
        choices: ["View All Employees", "View All Employees By Department", "View All Employees By Manager", "Add Employee", "Remove Employee", "Update Employee Role", "Update Employee Manager", "View All Roles", "Add Role", "Remove Role", "View All Departments", "Add Department", "Remove Department", "Exit"]
    }])
    switch (ans.initial) {
        case "View All Employees":
            return viewAllEmployees()
        case "View All Employees By Department":
            return viewAllEmployeesByDepartment()
        case "View All Employees By Manager":
            return viewAllEmployeesByManager()
        case "Add Employee":
            return addEmployee()
        case "Remove Employee":
            return removeEmployee()
        case "Update Employee Role":
            return updateEmployeeRole()
        case "Update Employee Manager":
            return updateEmployeeManager()
        case "View All Roles":
            return viewAllRoles()
        case "Add Role":
            return addRole()
        case "Remove Role":
            return removeRole()
        case "View All Departments":
            return viewAllDepartments()
        case "Add Department":
            return addDepartment()
        case "Remove Department":
            return removeDepartment()
        case "Exit":
            return exit()
        default:
            return console.log("Something went wrong, please contact the developer with your path and any encountered issues.")
            exit()
    }
}

async function SQL(sql, callback) {
    connection.query(sql, function (err, res) {
        if (err) throw err;
        return callback(res);
    })
}

async function viewAllEmployees() {
    connection.query(
        "SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name AS department, role.salary, CONCAT(manager.first_name, ' ', manager.last_name) AS manager FROM employee LEFT JOIN role on employee.role_id = role.id LEFT JOIN department on role.department_id = department.id LEFT JOIN employee manager on manager.id = employee.manager_id;",
        function (err, res) {
            if (err) throw err
            console.table(res)
            return askQuestions()
        })
}

async function viewAllEmployeesByDepartment() {
    connection.query(
        "SELECT * FROM department",
        async function (err, res) {
            if (err) throw err
            let dept = await prompt({
                type: "list",
                name: "dept",
                message: "Which department are you looking for?",
                choices: res
            })
            roleId = res.filter(x => {
                return x.name === dept.dept
            })
            let id = parseInt(roleId[0].id)
            connection.query(`SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name AS department, role.salary FROM employee LEFT JOIN role on employee.role_id = role.id LEFT JOIN department on role.department_id = department.id LEFT JOIN employee manager on manager.id = employee.manager_id WHERE role.department_id = ${id};`,
                async function (err, res) {
                    if (err) throw err
                    if (res == "") {
                        console.log("There are no employees in this department, perhaps it is time to hire.")
                        return askQuestions()
                    } else {
                        console.table(res)
                        return askQuestions()
                    }
                })
        })
}

async function addEmployee() {
    SQL("SELECT * from department", async function (result) {
        let depts = result.map(x => x.name);
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
            }
        ])
        let deptObj = result.filter(x => {
            return x.name === employee.department
        })
        let deptId = deptObj[0].id
        SQL(`SELECT * from role WHERE department_id = ${deptId}`, async function (result) {
            const roles = result.map(x => x.title);
            let role = await prompt({
                type: "list",
                name: "role",
                message: "What role does the employee occupy?",
                choices: roles
            })
            roleEmp = result.filter(x => {
                return x.title === role.role
            })
            employee["role_id"] = roleEmp[0].id
            delete employee.department;
            if (roleEmp[0].manager === 0) {
                SQL(`SELECT * from employee WHERE manager_id IS NULL`, async function (result) {
                    const managers = result.map(({
                        first_name,
                        last_name,
                        id
                    }) => ({
                        name: `${first_name} ${last_name}`,
                        value: id
                    }))
                    let managerObj = await prompt({
                        type: "list",
                        name: "manager",
                        message: "Who is the employees manager?",
                        choices: managers
                    })
                    employee["manager_id"] = managerObj.manager
                    SQL(`INSERT INTO customers (${Object.keys(employee)[0]}, ${Object.keys(employee)[1]}, ${Object.keys(employee)[2]}, ${Object.keys(employee)[3]}) VALUES (${Object.values(employee)[0]}, ${Object.values(employee)[1]}, ${Object.values(employee)[2]}, ${Object.values(employee)[3]})`)
                })
            }
        })
    })
    return askQuestions()
}

async function viewAllEmployeesByManager() {
    SQL(`SELECT * from employee WHERE manager_id IS NULL`, async function (result) {
        const managers = result.map(({
            first_name,
            last_name,
            id
        }) => ({
            name: `${first_name} ${last_name}`,
            value: id
        }))
        let managerObj = await prompt({
            type: "list",
            name: "manager",
            message: "Who is the employees manager?",
            choices: managers
        })
        let managerId = managerObj.manager
        connection.query(
            `SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name AS department, role.salary, CONCAT(manager.first_name, ' ', manager.last_name) AS manager FROM employee LEFT JOIN role on employee.role_id = role.id LEFT JOIN department on role.department_id = department.id LEFT JOIN employee manager on manager.id = employee.manager_id WHERE employee.manager_id = ${managerId};`,
            function (err, res) {
                if (err) throw err
                console.table(res)
                return askQuestions()
            })
    })
}

async function removeEmployee() {
    SQL("SELECT employee.id, employee.first_name, employee.last_name FROM employee", async function (res) {
        let employees = res.map(({
            id,
            first_name,
            last_name
        }) => ({
            name: `${first_name} ${last_name}`,
            value: id
        }))
        let empId = await prompt({
            type: "list",
            name: "id",
            message: "Who would you like to remove?",
            choices: employees
        })
        connection.query(`DELETE FROM employee WHERE id = ${empId.id}`)
    })
    return askQuestions()
}

async function updateEmployeeRole() {
    SQL("SELECT * FROM employee", async function (res) {
        let employees = res.map(({
            id,
            first_name,
            last_name,
            role_id
        }) => ({
            name: `${first_name} ${last_name}`,
            value: id,
            role: role_id
        }))
        let empId = await prompt({
            type: "list",
            name: "employee_id",
            message: "Whos role would you like to change?",
            choices: employees
        })
        SQL(`SELECT * FROM role WHERE id != ${Object.values(empId)[0]}`, async function (resp) {
            let roles = resp.map(x => x.title);
            role = await prompt({
                type: "list",
                name: "role",
                message: "What role would you like to change it to?",
                choices: roles
            })
            roleId = resp.filter(x => {
                return x.title === role.role
            })
            empId["role_id"] = roleId[0].id
            SQL(`UPDATE employee SET role_id = ${empId["role_id"]} WHERE id = ${empId["employee_id"]}`, async function (resp) {
                return askQuestions()
            })
        })
    })
}

async function updateEmployeeManager() {
    SQL("SELECT * FROM employee", async function (res) {
        let employees = res.map(({
            id,
            first_name,
            last_name,
            manager_id
        }) => ({
            name: `${first_name} ${last_name}`,
            value: id,
            manager: manager_id
        }))
        let empId = await prompt({
            type: "list",
            name: "employee_id",
            message: "Whos manager would you like to change?",
            choices: employees
        })
        SQL(`SELECT * FROM employee WHERE id != ${Object.values(empId)[0]} AND manager_id IS NULL`, async function (resp) {
            let managers = resp.map(({
                first_name,
                last_name,
                id
            }) => ({
                name: `${first_name} ${last_name}`,
                id: id
            }));
            manager = await prompt({
                type: "list",
                name: "manager",
                message: "What manager would you like to change to?",
                choices: managers
            })
            roleId = resp.filter(x => {
                return x.id === manager.manager
            })
            empId["manager_id"] = roleId[0].id
            SQL(`UPDATE employee SET manager_id = ${empId["manager_id"]} WHERE id = ${empId["employee_id"]}`, async function (resp) {
                return askQuestions()
            })
        })
    })
}

async function viewAllRoles() {
    connection.query(
        `SELECT role.title, department.name AS department, role.salary FROM role LEFT JOIN department on role.department_id = department.id`,
        function (err, res) {
            if (err) throw err
            console.table(res)
            return askQuestions()
        })
}

async function addRole() {
    connection.query(
        `SELECT department.name, department.id FROM department;`, async function (err, res) {
            if (err) throw err
            let role = await prompt([{
                    type: "input",
                    name: "title",
                    message: "What is the name of the new role?"
                },
                {
                    type: "input",
                    name: "salary",
                    message: "What is the annual salary of this role?",
                }
            ])
            parseInt(role.salary)
            if (isNaN(role.salary)) {
                console.log("Please enter a valid number when asked for a salary.")
                return addRole()
            }
            bits = await prompt([{
                    type: "list",
                    name: "department_id",
                    message: "What department is the new role a part of?",
                    choices: res
                },
                {
                    type: "confirm",
                    name: "manager",
                    message: "Is this role a managerial position?"
                }
            ])
            let departmentBit = res.filter(x => {
                return x.name === bits.department_id
            })[0].id
            bits['department_id'] = departmentBit
            role = Object.assign(role, bits)
            SQL(`INSERT INTO role (title, salary, department_id, manager) VALUES (${role.title}, ${role.salary}, ${role.department_id}, ${role.manager})`)
            return askQuestions()
        })
}

async function removeRole() {
    SQL(`SELECT * FROM role`, async function (resp) {
        let roles = resp.map(x => x.title);
        role = await prompt({
            type: "list",
            name: "role",
            message: "What role would you like to remove?",
            choices: roles
        })
        roleId = resp.filter(x => {
            return x.title === role.role
        })
        let id = roleId[0].id
        SQL(`DELETE FROM role WHERE id = ${id}`, async function (resp) {
            return askQuestions()
        })
    })
}

async function viewAllDepartments() {
    connection.query(
        // `SELECT first.role.title AS Role1, second.role.title AS Role1, 
        // department.name, SUM(role.salary) AS budget,
        // FROM role first JOIN role second
        // ON first.Id = second.Id
        // AND first.salary = second.salary 
        // AND first.title = second.title
        // LEFT JOIN role ON employee.role_id = role.id 
        // LEFT JOIN department ON role.department_id = department.id
        // ORDER BY department.name`
        `SELECT department.name, SUM(role.salary) AS budget FROM role LEFT JOIN employee on employee.role_id = role.id LEFT JOIN department on role.department_id = department.id GROUP BY department.name;`,
        function (err, res) {
            if (err) throw err
            console.table(res)
            return askQuestions()
        })
}

async function addDepartment() {
    let department = await prompt({
        name: "department",
        message: "What is the name of the new department?"
    })
    SQL(`INSERT INTO department (name) VALUES (${department.department})`)
    return askQuestions()
}

async function removeDepartment() {
    SQL(`SELECT * FROM department`, async function (resp) {
        let roles = resp.map(x => x.name);
        department = await prompt({
            type: "list",
            name: "department",
            message: "What department would you like to remove?",
            choices: roles
        })
        roleId = resp.filter(x => {
            return x.name === department.department
        })
        let id = roleId[0].id
        SQL(`DELETE FROM department WHERE id = ${id}`, async function (resp) {
            return askQuestions()
        })
    })
    return askQuestions()
}

async function exit() {
    process.exit()
}