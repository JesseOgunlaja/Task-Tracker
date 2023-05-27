import { useEffect, useState, useRef, Suspense } from "react";
import emailjs from "@emailjs/browser";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import "./App.css";
import bcrypt from "bcryptjs";
import CryptoJS from "crypto-js";
const api = window.location.href + "api";
const jwt = require("jsrsasign");

function App() {
  const INTERVAL = 1;
  const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD;
  const ENCRYPTION_KEY = process.env.REACT_APP_ENCRYPTION_KEY;
  const ENCRYPTION_SESSION_1 = process.env.REACT_APP_ENCRYPTION_SESSION_1;
  const ENCRYPTION_SESSION_2 = process.env.REACT_APP_ENCRYPTION_SESSION_2;
  const parsedSessionKey1 = CryptoJS.enc.Utf8.parse(ENCRYPTION_SESSION_1);
  const stringSessionKey1 = CryptoJS.enc.Utf8.stringify(parsedSessionKey1);
  const parsedSessionKey2 = CryptoJS.enc.Utf8.parse(ENCRYPTION_SESSION_2);
  const stringSessionKey2 = CryptoJS.enc.Utf8.stringify(parsedSessionKey2);
  const parsedKey = CryptoJS.enc.Utf8.parse(ENCRYPTION_KEY);
  const stringKey = CryptoJS.enc.Base64.stringify(parsedKey);
  const API_KEY = CryptoJS.AES.encrypt(
    process.env.REACT_APP_API_KEY,
    stringKey
  ).toString();
  const newTaskTitle = useRef();
  const newTaskDate = useRef();
  const newTaskReminder = useRef();
  const editIndex = useRef();
  const passwordBox = useRef();
  const oldPasswordBox = useRef();
  const newPasswordBox = useRef();
  const addUserName = useRef();
  const addUserPassword = useRef();
  const addUserEmail = useRef();
  const passwordBeingResetBox = useRef();
  const codeBeingInputtedBox = useRef();
  const adminPasswordBox = useRef();
  const usernameBox = useRef();

  const [adminPasswordBeingAdded, setAdminPasswordBeingAdded] = useState("");
  const [username, setUsername] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [tasks, setTasks] = useState(null);
  const [user, setUser] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [people, setPeople] = useState(null);
  const [nameBeingAdded, setNameBeingAdded] = useState("");
  const [userId, setUserId] = useState();
  const [isPuttingPassword, setIsPuttingPassword] = useState(false);
  const [passwordBeingAdded, setPasswordBeingAdded] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [emailBeingAdded, setEmailBeingAdded] = useState("");
  const [isForgettingPassword, setIsForgettingPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState(
    Math.floor(Math.random() * 1000000000)
  );
  const [email, setEmail] = useState("");
  const [codeBeingInputted, setCodeBeingInputted] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [passwordBeingReset, setPasswordBeingReset] = useState("");
  const [editedTaskTitle, setEditedTaskTitle] = useState("");
  const [editedTaskDate, setEditedTaskDate] = useState("");
  const [editedTaskReminder, setEditedTaskReminder] = useState();
  const [incorrectUsername, setIncorrectUsername] = useState(false);
  const [incorrectPassword, setIncorrectPassword] = useState(false);

  function signInUsername() {
    people.forEach((person) => {
      if (person.name.toUpperCase() === username.toUpperCase()) {
        signIn(person.name, person._id);
        return;
      }
    });
    setIncorrectUsername(true);
  }

  async function deleteTask(index) {
    const currentTasks = [...tasks];
    currentTasks.splice(index, 1);

    const SECRET_KEY = ENCRYPTION_KEY;
    const payload = {
      apiKey: process.env.REACT_APP_API_KEY,
      exp: Math.floor(Date.now() / 1000) + INTERVAL,
    };
    const header = { alg: "HS256", typ: "JWT" };
    const sHeader = JSON.stringify(header);
    const sPayload = JSON.stringify(payload);
    const token = jwt.jws.JWS.sign("HS256", sHeader, sPayload, SECRET_KEY);
    await fetch(`${api}/Users/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        tasks: currentTasks,
      }),
    });

    setTasks(await fetchTasks());
  }

  async function addTask() {
    if (newTaskTitle.current.value !== "" && newTaskDate.current.value !== "") {
      const newTask = {
        task: newTaskTitle.current.value,
        date: newTaskDate.current.value,
        reminder: newTaskReminder.current.checked,
      };

      const currentTasks = [...tasks];
      currentTasks.push(newTask);

      const SECRET_KEY = ENCRYPTION_KEY;
      const payload = {
        apiKey: process.env.REACT_APP_API_KEY,
        exp: Math.floor(Date.now() / 1000) + INTERVAL,
      };
      const header = { alg: "HS256", typ: "JWT" };
      const sHeader = JSON.stringify(header);
      const sPayload = JSON.stringify(payload);
      const token = jwt.jws.JWS.sign("HS256", sHeader, sPayload, SECRET_KEY);
      await fetch(`${api}/Users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tasks: currentTasks,
        }),
      });
    }
    setIsAdding(false);
    setTasks(await fetchTasks());
  }

  function edit(index) {
    if (isAdding === false) {
      setEditedTaskDate(tasks[index].date);
      setEditedTaskTitle(tasks[index].task);
      setEditedTaskReminder(tasks[index].reminder);
      setIsEditing(true);
      editIndex.current = index;
    }
  }

  async function editTask() {
    const updatedTask = {
      task: editedTaskTitle,
      date: editedTaskDate,
      reminder: editedTaskReminder,
    };

    const currentTasks = [...tasks];
    currentTasks[editIndex.current] = updatedTask;
    const SECRET_KEY = ENCRYPTION_KEY;
    const payload = {
      apiKey: process.env.REACT_APP_API_KEY,
      exp: Math.floor(Date.now() / 1000) + INTERVAL,
    };
    const header = { alg: "HS256", typ: "JWT" };
    const sHeader = JSON.stringify(header);
    const sPayload = JSON.stringify(payload);
    const token = jwt.jws.JWS.sign("HS256", sHeader, sPayload, SECRET_KEY);
    await fetch(`${api}/Users/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        tasks: currentTasks,
      }),
    });
    setTasks(await fetchTasks());
    setIsEditing(false);
  }

  useEffect(() => {
    async function getPeople() {
      setPeople(await fetchPeople());
    }

    getPeople();
  }, []);

  useEffect(() => {
    async function getTasks() {
      if (user !== "") {
        setTasks(await fetchTasks());
      }
    }
    getTasks();
  }, [user]);

  async function fetchTasks() {
    const SECRET_KEY = ENCRYPTION_KEY;
    const payload = {
      apiKey: process.env.REACT_APP_API_KEY,
      exp: Math.floor(Date.now() / 1000) + INTERVAL,
    };
    const header = { alg: "HS256", typ: "JWT" };
    const sHeader = JSON.stringify(header);
    const sPayload = JSON.stringify(payload);
    const token = jwt.jws.JWS.sign("HS256", sHeader, sPayload, SECRET_KEY);
    const res = await fetch(`${api}/Users/${userId}`, {
      methpd: "GET",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    const data = res.json();
    return data.then((res) => res.tasks);
  }

  async function fetchPeople() {
    const SECRET_KEY = ENCRYPTION_KEY;
    const payload = {
      apiKey: process.env.REACT_APP_API_KEY,
      exp: Math.floor(Date.now() / 1000) + INTERVAL,
    };
    const header = { alg: "HS256", typ: "JWT" };
    const sHeader = JSON.stringify(header);
    const sPayload = JSON.stringify(payload);
    const token = jwt.jws.JWS.sign("HS256", sHeader, sPayload, SECRET_KEY);
    const res = await fetch(`/api/Users`, {
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json().catch(() => window.location.reload());
    await checkIfSignedOut()
    return data;
  }

  async function checkIfSignedOut() {
    const authToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("authToken="))
      ?.split("=")[1];
    if (authToken) {
      const decrypt1 = CryptoJS.AES.decrypt(
        authToken,
        stringSessionKey1
      ).toString(CryptoJS.enc.Utf8);
      const decrypt2 = CryptoJS.AES.decrypt(
        decrypt1,
        stringSessionKey2
      ).toString(CryptoJS.enc.Utf8);
      setUserId(decrypt2);
      const SECRET_KEY = ENCRYPTION_KEY;
      const payload = {
        apiKey: process.env.REACT_APP_API_KEY,
        exp: Math.floor(Date.now() / 1000) + INTERVAL,
      };
      const header = { alg: "HS256", typ: "JWT" };
      const sHeader = JSON.stringify(header);
      const sPayload = JSON.stringify(payload);
      const token = jwt.jws.JWS.sign("HS256", sHeader, sPayload, SECRET_KEY);
      try {
        const res2 = await fetch(`${api}/Users/${userId}`, {
          method: "GET",
          headers: {
            authorization: `Bearer ${token}`,
          },
        })

        if(!res2.ok) {
          if(res2.status === 401) {
            throw new Error("API KEY")
          }
          if(res2.status === 404 && userId != undefined) {
            throw new Error("Cannot Find User")
          }
        }
        else {
          const data2 = await res2.json().catch(() => window.location.reload());
      setUser(data2.name);
      setSignedIn(true);
        }
      }
      catch (error) {
        if(error.message === "API KEY") {
          window.location.reload()
        }
        if(error.message === "Cannot Find User") {
          deleteCookie("authToken")
          window.location.reload()
        }
      }
      
    }
  }

  async function signIn(person, id) {
    setIsPuttingPassword(true);
    setUser(person);
    setUserId(id);
  }

  async function addUser() {
    if (
      nameBeingAdded !== "" &&
      passwordBeingAdded !== "" &&
      people.every(
        (val) =>
          val.name.toUpperCase() !== nameBeingAdded.toUpperCase() &&
          adminPasswordBeingAdded === ADMIN_PASSWORD
      )
    ) {
      adminPasswordBox.current.type = "password";
      addUserPassword.current.type = "password";
      addUserEmail.current.type = "password";
      const SECRET_KEY = ENCRYPTION_KEY;
      const payload = {
        apiKey: process.env.REACT_APP_API_KEY,
        exp: Math.floor(Date.now() / 1000) + INTERVAL,
      };
      const header = { alg: "HS256", typ: "JWT" };
      const sHeader = JSON.stringify(header);
      const sPayload = JSON.stringify(payload);
      const token = jwt.jws.JWS.sign("HS256", sHeader, sPayload, SECRET_KEY);
      await fetch(`${api}/Users`, {
        method: "POST",
        headers: {
          "Content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: nameBeingAdded,
          tasks: [],
          password: passwordBeingAdded,
          email: emailBeingAdded,
        }),
      });
      setPeople(await fetchPeople());
      signOut();
    }
  }

  function signOut() {
    setIncorrectPassword("");
    deleteCookie("authToken");
    setIncorrectUsername("");
    setUsername("");
    setEmailBeingAdded("");
    setPasswordBeingAdded("");
    setNewPassword("");
    setOldPassword("");
    setPasswordBeingReset("");
    setPasswordBeingAdded("");
    setIsResettingPassword(false);
    setVerificationCode(Math.floor(Math.random() * 1000000000));
    setCodeBeingInputted("");
    setIsChangingPassword(false);
    setNameBeingAdded("");
    setIsAdding(false);
    setIsAddingUser(false);
    setIsEditing(false);
    setIsPuttingPassword(false);
    setSignedIn(false);
  }

  async function deleteAccount() {
    const SECRET_KEY = ENCRYPTION_KEY;
    const payload = {
      apiKey: process.env.REACT_APP_API_KEY,
      exp: Math.floor(Date.now() / 1000) + INTERVAL,
    };
    const header = { alg: "HS256", typ: "JWT" };
    const sHeader = JSON.stringify(header);
    const sPayload = JSON.stringify(payload);
    const token = jwt.jws.JWS.sign("HS256", sHeader, sPayload, SECRET_KEY);
    await fetch(`${api}/Users/${userId}`, {
      method: "DELETE",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    setPeople(await fetchPeople());
    signOut();
  }

  async function submitPassword() {
    const SECRET_KEY = ENCRYPTION_KEY;
    const payload = {
      apiKey: process.env.REACT_APP_API_KEY,
      exp: Math.floor(Date.now() / 1000) + INTERVAL,
    };
    const header = { alg: "HS256", typ: "JWT" };
    const sHeader = JSON.stringify(header);
    const sPayload = JSON.stringify(payload);
    const token = jwt.jws.JWS.sign("HS256", sHeader, sPayload, SECRET_KEY);
    let password = (
      await (
        await fetch(`${api}/Users/${userId}`, {
          method: "GET",
          headers: {
            authorization: `Bearer ${token}`,
          },
        })
      ).json()
    ).password;
    if (passwordBeingAdded === ADMIN_PASSWORD) {
      passwordBox.current.type = "password";
      setSignedIn(true);
      return;
    }
    if (await bcrypt.compare(passwordBeingAdded, password)) {
      passwordBox.current.type = "password";
      const FIRST_ENCRYPTION = CryptoJS.AES.encrypt(
        userId,
        stringSessionKey1
      ).toString();
      const SECOND_ENCRYPTION = CryptoJS.AES.encrypt(
        FIRST_ENCRYPTION,
        stringSessionKey2
      ).toString();
      document.cookie = `authToken=${SECOND_ENCRYPTION}; path=/`;
      setSignedIn(true);
      return;
    }
    setIncorrectPassword(true);
  }

  function changePassword() {
    setIsAdding(false);
    setIsEditing(false);
    signOut();
    setIsChangingPassword(true);
  }

  async function completeChangePassword() {
    const SECRET_KEY = ENCRYPTION_KEY;
    const payload = {
      apiKey: process.env.REACT_APP_API_KEY,
      exp: Math.floor(Date.now() / 1000) + INTERVAL,
    };
    const header = { alg: "HS256", typ: "JWT" };
    const sHeader = JSON.stringify(header);
    const sPayload = JSON.stringify(payload);
    const token = jwt.jws.JWS.sign("HS256", sHeader, sPayload, SECRET_KEY);
    let password = (
      await (
        await fetch(`${api}/Users/${userId}`, {
          method: "GET",
          headers: {
            authorization: `Bearer ${token}`,
          },
        })
      ).json()
    ).password;
    oldPasswordBox.current.type = "password";
    newPasswordBox.current.type = "password";
    if (
      (await bcrypt.compare(oldPassword, password)) ||
      oldPassword === ADMIN_PASSWORD
    ) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const SECRET_KEY = ENCRYPTION_KEY;
      const payload = {
        apiKey: process.env.REACT_APP_API_KEY,
        exp: Math.floor(Date.now() / 1000) + INTERVAL,
      };
      const header = { alg: "HS256", typ: "JWT" };
      const sHeader = JSON.stringify(header);
      const sPayload = JSON.stringify(payload);
      const token = jwt.jws.JWS.sign("HS256", sHeader, sPayload, SECRET_KEY);
      await fetch(`${api}/Users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          password: hashedPassword,
        }),
      });
      signOut();
    }
  }

  useEffect(() => {
    if (passwordBox.current) {
      passwordBox.current.focus();
    }
  }, [isPuttingPassword]);

  useEffect(() => {
    if (oldPasswordBox.current) {
      oldPasswordBox.current.focus();
    }
  }, [isChangingPassword]);

  useEffect(() => {
    if (addUserName.current) {
      addUserName.current.focus();
    }
  }, [isAddingUser]);

  useEffect(() => {
    if (codeBeingInputtedBox.current) {
      codeBeingInputtedBox.current.focus();
    }
  }, [isForgettingPassword]);

  useEffect(() => {
    if (passwordBeingResetBox.current) {
      passwordBeingResetBox.current.focus();
    }
  }, [isForgettingPassword]);

  window.onkeyup = function (e) {
    if (e.code === "Enter") {
      if (isPuttingPassword && passwordBox.current === document.activeElement) {
        submitPassword();
      }
      if (
        isChangingPassword &&
        newPasswordBox.current === document.activeElement
      ) {
        completeChangePassword();
      }
      if (isAddingUser && adminPasswordBox.current === document.activeElement) {
        addUser();
      }
      if (
        isResettingPassword &&
        passwordBeingResetBox.current === document.activeElement
      ) {
        submitNewPassword();
      }
      if (usernameBox.current === document.activeElement) {
        signInUsername();
      }
    }
  };

  function showPassword(password) {
    if (password === "newUserPassword") {
      if (addUserPassword.current.type === "text") {
        addUserPassword.current.type = "password";
      } else {
        addUserPassword.current.type = "text";
      }
    }
    if (password === "oldPassword") {
      if ((oldPasswordBox.current.type = "text")) {
        oldPasswordBox.current.type = "password";
      } else {
        oldPasswordBox.current.type = "text";
      }
    }
    if (password === "newPassword") {
      if ((newPasswordBox.current.type = "text")) {
        newPasswordBox.current.type = "password";
      } else {
        newPasswordBox.current.type = "text";
      }
    }
    if (password === "password") {
      if ((passwordBox.current.type = "text")) {
        passwordBox.current.type = "password";
      } else {
        passwordBox.current.type = "text";
      }
    }
    if (password === "resetPassword") {
      if ((passwordBeingResetBox.current.type = "text")) {
        passwordBeingResetBox.current.type = "password";
      } else {
        passwordBeingResetBox.current.type = "text";
      }
    }
    if (password === "adminPassword") {
      if ((adminPasswordBox.current.type = "text")) {
        adminPasswordBox.current.type = "password";
      } else {
        adminPasswordBox.current.type = "text";
      }
    }
  }

  async function forgotPassword() {
    const formData = {
      code: verificationCode,
      user_name: user,
      user_email: email,
    };
    setIsForgettingPassword(true);
    emailjs
      .send(
        "service_qt8bik7",
        "template_938j99h",
        formData,
        "SWBcr0pFf3wH4zk_K"
      )
      .then(
        (result) => {
          console.log(result.text);
        },
        (error) => {
          console.log(error.text);
        }
      );
  }

  function submitVerificationCode() {
    if (codeBeingInputted === verificationCode) {
      setIsResettingPassword(true);
      setIsForgettingPassword(false);
    }
  }

  async function submitNewPassword() {
    const hashedPassword = await bcrypt.hash(passwordBeingReset, 10);
    const SECRET_KEY = ENCRYPTION_KEY;
    const payload = {
      apiKey: process.env.REACT_APP_API_KEY,
      exp: Math.floor(Date.now() / 1000) + INTERVAL,
    };
    const header = { alg: "HS256", typ: "JWT" };
    const sHeader = JSON.stringify(header);
    const sPayload = JSON.stringify(payload);
    const token = jwt.jws.JWS.sign("HS256", sHeader, sPayload, SECRET_KEY);
    await fetch(`${api}/Users/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        password: hashedPassword,
      }),
    });
    signOut();
  }

  function back(page) {
    if (page === "signInPassword") {
      setPasswordBeingAdded("");
      setIsPuttingPassword("");
      setIncorrectUsername(false);
      setIncorrectPassword("");
      setUsername("");
    }
    if (page === "changePassword") {
      setIsChangingPassword(false);
      setSignedIn(true);
    }
    if (page === "addingUser") {
      setAdminPasswordBeingAdded("");
      setEmailBeingAdded("");
      setNameBeingAdded("");
      setPasswordBeingAdded("");
      setIsAddingUser(false);
      setIncorrectUsername(false);
    }
    if (page === "forgetPassword") {
      setIsForgettingPassword(false);
      setIsPuttingPassword(false);
    }
  }

  useEffect(() => {
    async function getEmail() {
      if (userId != undefined) {
        const SECRET_KEY = ENCRYPTION_KEY;
        const payload = {
          apiKey: process.env.REACT_APP_API_KEY,
          exp: Math.floor(Date.now() / 1000) + INTERVAL,
        };
        const header = { alg: "HS256", typ: "JWT" };
        const sHeader = JSON.stringify(header);
        const sPayload = JSON.stringify(payload);
        const token = jwt.jws.JWS.sign("HS256", sHeader, sPayload, SECRET_KEY);
        setEmail(
          (
            await (
              await fetch(`${api}/Users/${userId}`, {
                method: "GET",
                headers: {
                  authorization: `Bearer ${token}`,
                },
              })
            ).json()
          ).email
        );
      }
    }

    getEmail();
  }, [userId, isForgettingPassword]);

  function deleteCookie(cookieName) {
    document.cookie =
      cookieName + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  }

  return (
    <Router>
      {/* Makes it possible to use Routes */}
      <div className="app">
        <Routes>
          <Route
            path="/"
            element={
              <>
                {signedIn ? (
                  <>
                    <div className="container">
                      <div className="header">
                        <h1 className="title">Task Tracker</h1>
                        <button
                          className={isAdding ? "button red" : "button green"}
                          onClick={() =>
                            isEditing === false && setIsAdding(!isAdding)
                          }
                        >
                          {isAdding ? "Close" : "Add"}
                        </button>
                      </div>
                      {isAdding || isEditing ? (
                        <div className={isAdding ? "addTask" : "editTask"}>
                          <label
                            className={
                              isAdding ? "addTaskLabel" : "editTaskLabel"
                            }
                            htmlFor="task"
                          >
                            Task
                          </label>
                          <input
                            autoComplete="off"
                            ref={isAdding ? newTaskTitle : null}
                            className={
                              isAdding ? "addTaskInput" : "editTaskInput"
                            }
                            value={isEditing ? editedTaskTitle : undefined}
                            onChange={(e) =>
                              isEditing && setEditedTaskTitle(e.target.value)
                            }
                            type="text"
                            placeholder={isAdding ? "Doctors Appoinment" : null}
                            id="task"
                          />
                          <label
                            className={
                              isAdding ? "addTaskLabel" : "editTaskLabel"
                            }
                            htmlFor="day"
                          >
                            Time
                          </label>
                          <input
                            autoComplete="off"
                            ref={isAdding ? newTaskDate : null}
                            type="text"
                            value={isEditing ? editedTaskDate : undefined}
                            onChange={(e) =>
                              isEditing && setEditedTaskDate(e.target.value)
                            }
                            className={
                              isAdding ? "addTaskInput" : "editTaskInput"
                            }
                            placeholder={isAdding ? "February 6th" : null}
                            id="day"
                          />
                          <div
                            className={
                              isAdding ? "addTaskReminder" : "editTaskReminder"
                            }
                          >
                            <label
                              htmlFor="reminder"
                              className={
                                isAdding ? "addTaskLabel" : "editTaskLabel"
                              }
                            >
                              Reminder
                            </label>
                            <input
                              ref={isAdding ? newTaskReminder : null}
                              className="reminderCheckbox"
                              id="reminder"
                              type="checkbox"
                              checked={isEditing ? editedTaskReminder : null}
                              onChange={(e) =>
                                isEditing &&
                                setEditedTaskReminder(e.target.checked)
                              }
                            />
                          </div>
                          {isEditing && (
                            <button
                              className="red cancel-button"
                              onClick={() => setIsEditing(false)}
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            onClick={() => (isAdding ? addTask() : editTask())}
                            className="saveTask"
                          >
                            Save Task
                          </button>
                        </div>
                      ) : null}
                      {tasks != null ? (
                        <>
                          {tasks.length !== 0 ? (
                            tasks.map((task, index) => (
                              <div
                                key={Math.random()}
                                className={
                                  task.reminder ? "task reminder" : "task"
                                }
                              >
                                <p className="taskName">{task.task}</p>
                                <p className="taskDate">{task.date}</p>
                                <div
                                  onClick={() => deleteTask(index)}
                                  className="deleteButton"
                                >
                                  <hr className="line1" />
                                  <hr className="line2" />
                                </div>
                                <button
                                  className="button green edit-button"
                                  onClick={() => edit(index)}
                                >
                                  Edit
                                </button>
                              </div>
                            ))
                          ) : (
                            <p className="noTasks">No tasks</p>
                          )}
                        </>
                      ) : (
                        <div className="loadingBox">
                          <p>Loading Tasks</p>
                          <div className="loader-3">
                            <div className="pulse"></div>
                            <div className="pulse"></div>
                            <div className="pulse"></div>
                          </div>
                        </div>
                      )}
                      <div className="signOutButtons">
                        <button
                          className="signOutButton"
                          onClick={changePassword}
                        >
                          Change Password
                        </button>
                        <button
                          className="signOutButton red"
                          onClick={deleteAccount}
                        >
                          Delete Account
                        </button>
                        <button
                          className="signOutButton green"
                          onClick={signOut}
                        >
                          Sign Out
                        </button>
                      </div>
                      <footer className="footer">
                        <p>Copyright &copy; 2023</p>
                        <Link to="/about">About</Link>
                      </footer>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="container">
                      {isAddingUser ? (
                        <div className="addUser">
                          <div
                            className="back addingUser"
                            onClick={() => back("addingUser")}
                          >
                            <div className="backTriangle">{"<"}</div>
                            <div>Back</div>
                          </div>
                          <label className="addUserName">Name:</label>
                          <input
                            ref={addUserName}
                            value={nameBeingAdded}
                            onChange={(e) => setNameBeingAdded(e.target.value)}
                            className="addUserInput"
                            type="text"
                          />
                          <label className="addUserName">Email:</label>
                          <input
                            ref={addUserEmail}
                            value={emailBeingAdded}
                            onChange={(e) => setEmailBeingAdded(e.target.value)}
                            className="addUserInput"
                            type="email"
                          />
                          <label className="addUserName">Password:</label>
                          <input
                            ref={addUserPassword}
                            value={passwordBeingAdded}
                            onChange={(e) =>
                              setPasswordBeingAdded(e.target.value)
                            }
                            className="addUserInput show"
                            type="password"
                          />
                          <div
                            className="showButton"
                            onClick={() => showPassword("newUserPassword")}
                          >
                            Show
                          </div>
                          <label className="addUserName">Admin Password:</label>
                          <input
                            ref={adminPasswordBox}
                            value={adminPasswordBeingAdded}
                            onChange={(e) =>
                              setAdminPasswordBeingAdded(e.target.value)
                            }
                            className="addUserInput show"
                            type="password"
                          />
                          <div
                            className="showButton"
                            onClick={() => showPassword("adminPassword")}
                          >
                            Show
                          </div>
                          <button
                            onClick={addUser}
                            className="signOutButton wide"
                          >
                            Add
                          </button>
                        </div>
                      ) : (
                        <>
                          {isPuttingPassword ? (
                            <div>
                              {isResettingPassword ? (
                                <div>
                                  <label>New Password</label>
                                  <input
                                    className="addUserInput show"
                                    type="password"
                                    value={passwordBeingReset}
                                    ref={passwordBeingResetBox}
                                    onChange={(e) =>
                                      setPasswordBeingReset(e.target.value)
                                    }
                                  />
                                  <div
                                    className="showButton"
                                    onClick={() =>
                                      showPassword("resetPassword")
                                    }
                                  >
                                    Show
                                  </div>
                                  <button
                                    onClick={() => submitNewPassword()}
                                    className="signOutButton wide"
                                  >
                                    Submit
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  {isForgettingPassword ? (
                                    <div>
                                      <div
                                        className="back"
                                        onClick={() => back("forgetPassword")}
                                      >
                                        <div className="backTriangle">
                                          {"<"}
                                        </div>
                                        <div>Back</div>
                                      </div>
                                      <p>
                                        We just sent a verification code to:{" "}
                                        {email}
                                      </p>
                                      <br />
                                      <label>Code:</label>
                                      <input
                                        ref={codeBeingInputtedBox}
                                        value={codeBeingInputted}
                                        onChange={(e) =>
                                          setCodeBeingInputted(
                                            Number(e.target.value)
                                          )
                                        }
                                        type="number"
                                        className="addUserInput"
                                      />
                                      <button
                                        className="signOutButton wide"
                                        onClick={submitVerificationCode}
                                      >
                                        Submit
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <div
                                        className="back"
                                        onClick={() => back("signInPassword")}
                                      >
                                        <div className="backTriangle">
                                          {"<"}
                                        </div>
                                        <div>Back</div>
                                      </div>
                                      <label>Password</label>
                                      <input
                                        ref={passwordBox}
                                        type="password"
                                        className="password show"
                                        value={passwordBeingAdded}
                                        onChange={(e) =>
                                          setPasswordBeingAdded(e.target.value)
                                        }
                                      />
                                      <div
                                        className="showButton"
                                        onClick={() => showPassword("password")}
                                      >
                                        Show
                                      </div>
                                      <button
                                        className="submitPassword"
                                        onClick={submitPassword}
                                      >
                                        Sign in
                                      </button>
                                      {incorrectPassword ? (
                                        <div className="line">
                                          <div
                                            style={{ display: "inline" }}
                                            className="incorrectUsername"
                                          >
                                            <p>Incorrect password</p>
                                          </div>
                                          <div
                                            className="forgotPassword"
                                            onClick={() => forgotPassword()}
                                          >
                                            Forgot Password?
                                          </div>
                                        </div>
                                      ) : (
                                        <div
                                          className="forgotPassword"
                                          onClick={() => forgotPassword()}
                                        >
                                          Forgot Password?
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <>
                              {isChangingPassword ? (
                                <div>
                                  <div
                                    className="back"
                                    onClick={() => back("changePassword")}
                                  >
                                    <div className="backTriangle">{"<"}</div>
                                    <div>Back</div>
                                  </div>
                                  <label className="addUserName">
                                    Old Password
                                  </label>
                                  <input
                                    ref={oldPasswordBox}
                                    className="addUserInput show"
                                    value={oldPassword}
                                    type="password"
                                    onChange={(e) =>
                                      setOldPassword(e.target.value)
                                    }
                                  />
                                  <div
                                    className="showButton"
                                    onClick={() => showPassword("oldPassword")}
                                  >
                                    Show
                                  </div>
                                  <label className="addUserName">
                                    New Password
                                  </label>
                                  <input
                                    ref={newPasswordBox}
                                    className="addUserInput show"
                                    value={newPassword}
                                    type="password"
                                    onChange={(e) =>
                                      setNewPassword(e.target.value)
                                    }
                                  />
                                  <div
                                    className="showButton"
                                    onClick={() => showPassword("newPassword")}
                                  >
                                    Show
                                  </div>
                                  <button
                                    className="submitButton"
                                    onClick={completeChangePassword}
                                  >
                                    Submit
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <div className="header">
                                    <h1
                                      className="title"
                                      style={{ textAlign: "center" }}
                                    >
                                      Task Tracker
                                    </h1>
                                    <button
                                      className="addUserButton"
                                      onClick={() => setIsAddingUser(true)}
                                    >
                                      Add User
                                    </button>
                                  </div>
                                  <div className="signInUsername">
                                    {people ? (
                                      <div className="">
                                        <label>Username</label>
                                        <input
                                          value={username}
                                          ref={usernameBox}
                                          onChange={(e) =>
                                            setUsername(e.target.value)
                                          }
                                          className="addUserInput"
                                          type="text"
                                        />
                                        <button
                                          className="submitPassword"
                                          onClick={signInUsername}
                                        >
                                          Sign in
                                        </button>
                                        {incorrectUsername && (
                                          <div className="incorrectUsername">
                                            <p>Incorrect username</p>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="loadingBox">
                                        <div className="loader-3">
                                          <div className="pulse"></div>
                                          <div className="pulse"></div>
                                          <div className="pulse"></div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </>
                )}
              </>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
