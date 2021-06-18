var express = require("express")
var router = express.Router()
var fs = require("fs").promises
var ObjectId = require("mongodb").ObjectID
var common = require("../common")
/**
 * routing to /class_schedule
 *  get the database -> show tabular form
 */
router.get("/class_schedule_list", function (req, res) {
    (async function () {
        let tbtext = "";
        const result = await common.getDb().collection("class").find().toArray()
        /**
		 * @region
		 * 		set today date
		 */
        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); // January is 0!
        var yyyy = today.getFullYear();
        today = yyyy + '-' + mm + '-' + dd
        // today = dd + '-' + mm  + '-' + yyyy;
        /**
		 * @end
		 */
        let stt = 1
        result.forEach(function (schedule) {

            if (schedule["date"] === today) {

                let dateCreated = new Date(schedule["date_created"])
                let strDateCreated = dateCreated.getHours() + ":" + dateCreated.getMinutes() + ", " + dateCreated.getDate() + "/" + (
                    dateCreated.getMonth() + 1
                ) + "/" + dateCreated.getFullYear()
                tbtext = tbtext + "<tr><th scope=\"row\">" + stt + "</th>" + "<td>" + schedule["class"] + "</td>" + "<td>" + schedule["room"] + "</td>" + "<td>" + schedule["time"] + "</td>" + "<td>" + schedule["date"] + "</td>" + "<td>" + schedule["teacher"] + "</td>" + "<td>" + strDateCreated + "</td>" + "<td><a href=\"/class_schedule_edit_" + schedule["_id"] + "\">Edit</a></td>" + "<td><a href=\"javascript:confirmDelete('" + schedule["_id"] + "')\">Delete</a></td>" + "</tr>"
                stt++
            }
        })
        let parts = {
            tb: tbtext,
            date: today
        }
        console.log(parts)
        res.parts = {
            ... res.parts,
            ... parts
        }
        res.viewpath = './views/class_schedule_list.html'
        await common.render(res)
    })()
})
router.get("/class_schedule_list_:date", function (req, res) {
    (async function () {
        let tbtext = "";
        const result = await common.getDb().collection("class").find().toArray()
        var oid = req.params["date"]
        // var x =document.getElementById("date").value = oid;
        let stt = 1
        result.forEach(function (schedule) {
            console.log(schedule["date"] + "is")

            if (schedule["date"] === oid) {
                let dateCreated = new Date(schedule["date_created"])
                let strDateCreated = dateCreated.getHours() + ":" + dateCreated.getMinutes() + ", " + dateCreated.getDate() + "/" + (
                    dateCreated.getMonth() + 1
                ) + "/" + dateCreated.getFullYear()
                tbtext = tbtext + "<tr><th scope=\"row\">" + stt + "</th>" + "<td>" + schedule["class"] + "</td>" + "<td>" + schedule["room"] + "</td>" + "<td>" + schedule["time"] + "</td>" + "<td>" + schedule["date"] + "</td>" + "<td>" + schedule["teacher"] + "</td>" + "<td>" + strDateCreated + "</td>" + "<td><a href=\"/class_schedule_edit_" + schedule["_id"] + "\">Edit</a></td>" + "<td><a href=\"javascript:confirmDelete('" + schedule["_id"] + "')\">Delete</a></td>" + "</tr>"
                stt++
            }
        })
        // let parts = {	tb: tbtext}
        let parts = {
            tb: tbtext,
            date: oid
        }
        res.parts = {
            ... res.parts,
            ... parts
        }
        res.viewpath = './views/class_schedule_list.html'
        await common.render(res)
    })()
})
/**
 * routing to class_schedule_create
 *      -> admin create class schedule object and assign teachers/users.
 */
router.get("/class_schedule_create", function (req, res) {
    (async function () {
        const result = await common.getDb().collection("users").find().toArray()
        let teacherTxt = ""
        result.forEach(function (teacher) {
            var tmp = teacher["username"];
            teacherTxt += "<option value='" + tmp + "'name = '" + tmp + "'>" + tmp + "</option>"
        })
        let parts = {
            msg_style: "display:none;",
            classname_value: "",
            teachername_value: teacherTxt,
            classname_err: "",
            room_err: "",
            date_err: "",
            room_value: "",
            teachername_err: ""
        }
        res.parts = {
            ... res.parts,
            ... parts
        }
        res.viewpath = './views/class_schedule_create.html'
        await common.render(res)
    })()
})
/**
 * insert new class schedule to database
 *  
 */
router.post("/class_schedule_create", function (req, res) {
    (async function () {
        console.log(req.body.time)
        let success = true
        let parts = {
            msg_style: "display:none;",
            classname_value: req.body.classname,
            room_value: req.body.room,
            date_value: req.body.date,
            teachername_value: req.body.teachername,
            classname_err: "",
            teachername_err: "",
            date_err: "",
            room_err: ""
        }
        console.log(parts);
        var send_html = true,
            result = null
        if (req.body.classname.length < 0 || req.body.classname.length > 32) {
            parts["classname_err"] = "<span style='color:red'>Length of class name is not valid</span>"
            success = false
        }
        try {
            var isExist = await common.getDb().collection("class").findOne(class_obj)
        } catch (err) {
            console.log("error")
        }
        if (isExist != null) {
            success = false
            parts["classname_err"] = "<span style='color:red'>Duplicated Data</span>"
        }
        if (success) {
            let class_obj = {
                "class": req.body.classname,
                "room": req.body.room,
                "date": req.body.date,
                "teacher": req.body.teacher,
                "time": req.body.time,
                date_created: Date.now()
            }
            console.log(class_obj);

            try {
                const result = await common.getDb().collection("class").insertOne(class_obj)
                parts["msg_style"] = ""
            } catch (err) {
                console.log(err)
                res.send("500 error inserting to db")
                send_html = false
            }
        }
        if (send_html) {
            res.parts = {
                ... res.parts,
                ... parts
            }
            res.viewpath = './views/class_schedule_create.html'
            await common.render(res)
        }
    })()
})
/**
 * get the data of class wanted to edit 
 *  -> Enter new data to edit/update
 */
router.get("/class_schedule_edit_:class_scheduleId", function (req, res) {
    (async function () {
        var oid = new ObjectId(req.params["class_scheduleId"])
        var query = {
            "_id": oid
        }
        result = null
        try {
            result = await common.getDb().collection("class").findOne(query)
        } catch (err) {
            console.log("error")
        }
        if (result == null) {
            res.send("class with id '" + req.params["class_scheduleId"] + "' cannot be found!")
            return;
        }
        const teacherArray = await common.getDb().collection("users").find().toArray()
        let teacherTxt = ""
        teacherArray.forEach(function (teacher) {
            var tmp = teacher["username"];
            teacherTxt += "<option value='" + tmp + "'name = '" + tmp + "'>" + tmp + "</option>"
        })
        let parts = {
            msg_style: "display:none;",
            class_scheduleId: req.params["class_scheduleId"],
            classname_value: result["class"],
            teachername_value: teacherTxt,
            room_value: result["room"],
            classname_err: "",
            teachername_err: "",
            date_err: "",
            room_err: ""
        }
        res.parts = {
            ... res.parts,
            ... parts
        }
        res.viewpath = './views/class_schedule_edit.html'
        await common.render(res)
    })()
})
/**
 * update the changes
 */
router.post("/class_schedule_edit_:class_scheduleId", function (req, res) {
    (async function () {
        let success = true
        var oid = new ObjectId(req.params["class_scheduleId"])
        var query = {
            "_id": oid
        }
        objUser = null
        try {
            objUser = await common.getDb().collection("class").findOne(query)
        } catch (err) {
            console.log("error")
        }
        if (objUser == null) {
            res.send("Class with id '" + req.params["class_scheduleId"] + "' cannot be found!")
            return;
        }

        let parts = {
            msg_style: "display:none;",
            class_scheduleId: req.params["productId"],
            classname_value: result["class"],
            room_value: result["room"],
            classname_err: "",
            teachername_err: "",
            date_err: "",
            room_err: ""
        }

        if (req.body.classname.length < 0 || req.body.classname.length > 32) {
            parts["usr_err"] = "<span style='color:red'>Classname length is not valid</span>"
            success = false
        } else {
            var query = {
                "_id": {
                    $ne: oid
                },
                class: req.body.classname
            }
            result = null
            try {
                result = await common.getDb().collection("class").findOne(query)
            } catch (err) {
                console.log("error")
            }
            if (result != null) {
                parts["classname_err"] = "<span style='color:red'>Class '" + req.body.classname + "' has been used already</span>"
                success = false
            }
        }
        objUser["class"] = req.body.classname
        objUser["room"] = req.body.room
        objUser["date"] = req.body.date
        objUser["teacher"] = req.body.teacher
        objUser["time"] = req.body.time

        if (success) {
            var query = {
                "_id": oid
            }
            try {
                const result = await common.getDb().collection("class").updateOne(query, {$set: objUser})
                parts["msg_style"] = ""
            } catch (err) {
                console.log(err)
                res.send("500 error updating db")
                return;
            }
        }

        res.parts = {
            ... res.parts,
            ... parts
        }
        res.viewpath = './views/class_schedule_edit.html'
        await common.render(res)
    })()
})
/**
 * delete the class
 */
router.get("/class_schedule_delete_:class_scheduleId", function (req, res) {
    (async function () {
        console.log("st in delete")
        var oid = new ObjectId(req.params["class_scheduleId"])
        var query = {
            "_id": oid
        }
        result = null
        try {
            result = await common.getDb().collection("class").deleteOne(query)
        } catch (err) {
            res.send("database error")
            return;
        }
        res.redirect(302, "/class_schedule_list")
    })()
})
module.exports = router
