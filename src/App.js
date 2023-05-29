import { useEffect, useState, useRef } from "react";
import emailjs from "@emailjs/browser";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import bcrypt from "bcryptjs";
import CryptoJS from "crypto-js";
const jwt = require("jsrsasign");

function App() {
  const INTERVAL = 1;
  let verificationCode = Math.floor(Math.random() * 1000000000);
  const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD;
  const DATA_ENCRYPTION_KEY1 = process.env.REACT_APP_DATA_ENCRYPTION1;
  const parsedDataKey1 = CryptoJS.enc.Utf8.parse(DATA_ENCRYPTION_KEY1);
  const stringDataKey1 = CryptoJS.enc.Utf8.stringify(parsedDataKey1);
  const DATA_ENCRYPTION_KEY2 = process.env.REACT_APP_DATA_ENCRYPTION2;
  const parsedDataKey2 = CryptoJS.enc.Utf8.parse(DATA_ENCRYPTION_KEY2);
  const stringDataKey2 = CryptoJS.enc.Utf8.stringify(parsedDataKey2);
  const ENCRYPTION_KEY = process.env.REACT_APP_ENCRYPTION_KEY;
  const ENCRYPTION_SESSION_1 = process.env.REACT_APP_ENCRYPTION_SESSION_1;
  const ENCRYPTION_SESSION_2 = process.env.REACT_APP_ENCRYPTION_SESSION_2;
  const parsedSessionKey1 = CryptoJS.enc.Utf8.parse(ENCRYPTION_SESSION_1);
  const stringSessionKey1 = CryptoJS.enc.Utf8.stringify(parsedSessionKey1);
  const parsedSessionKey2 = CryptoJS.enc.Utf8.parse(ENCRYPTION_SESSION_2);
  const stringSessionKey2 = CryptoJS.enc.Utf8.stringify(parsedSessionKey2);

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
  const newEmailBox = useRef();

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
  const [isChangingData, setIsChangingData] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [emailBeingAdded, setEmailBeingAdded] = useState("");
  const [isForgettingPassword, setIsForgettingPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [codeBeingInputted, setCodeBeingInputted] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [passwordBeingReset, setPasswordBeingReset] = useState("");
  const [editedTaskTitle, setEditedTaskTitle] = useState("");
  const [editedTaskDate, setEditedTaskDate] = useState("");
  const [editedTaskReminder, setEditedTaskReminder] = useState();
  const [dataBeingChanged, setDataBeingChanged] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const error = (text) =>
    toast.error(text, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "dark",
    });

  async function completeChangeEmail() {
    const encryptedEmail = encryptString(newEmail);
    back("changeEmail");
    const SECRET_KEY = ENCRYPTION_KEY;
    const payload = {
      apiKey: process.env.REACT_APP_API_KEY,
      exp: Math.floor(Date.now() / 1000) + INTERVAL,
    };
    const header = { alg: "HS256", typ: "JWT" };
    const sHeader = JSON.stringify(header);
    const sPayload = JSON.stringify(payload);
    const token = jwt.jws.JWS.sign("HS256", sHeader, sPayload, SECRET_KEY);
    await fetch(`api/Users/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email: encryptedEmail,
      }),
    });
    setSignedIn(true);
  }

  function encryptString(nameGiven) {
    const encrypted1 = CryptoJS.AES.encrypt(
      nameGiven,
      stringDataKey1
    ).toString();
    const encrypted2 = CryptoJS.AES.encrypt(
      encrypted1,
      stringDataKey2
    ).toString();
    return encrypted2;
  }

  function decryptString(nameGiven) {
    const decrypted1 = CryptoJS.AES.decrypt(nameGiven, stringDataKey2).toString(
      CryptoJS.enc.Utf8
    );
    const decrypted2 = CryptoJS.AES.decrypt(
      decrypted1,
      stringDataKey1
    ).toString(CryptoJS.enc.Utf8);
    return decrypted2;
  }

  function signInUsername() {
    if (username === "") {
      error("Name required");
      return;
    }
    if (
      people.every(
        (person) =>
          decryptString(person.name).toUpperCase() !== username.toUpperCase()
      )
    ) {
      error("Cannot find user");
    }
    people.forEach((person) => {
      if (decryptString(person.name).toUpperCase() === username.toUpperCase()) {
        signIn(person.name, person._id);
        return;
      }
    });
  }

  async function deleteTask(index) {
    const currentTasks = [...tasks];
    const encryptedTasks = currentTasks.map((task) => {
      const newTask = encryptString(task.task);
      const newDate = encryptString(task.date);
      return {
        reminder: task.reminder,
        _id: task._id,
        task: newTask,
        date: newDate,
      };
    });
    encryptedTasks.splice(index, 1);

    const SECRET_KEY = ENCRYPTION_KEY;
    const payload = {
      apiKey: process.env.REACT_APP_API_KEY,
      exp: Math.floor(Date.now() / 1000) + INTERVAL,
    };
    const header = { alg: "HS256", typ: "JWT" };
    const sHeader = JSON.stringify(header);
    const sPayload = JSON.stringify(payload);
    const token = jwt.jws.JWS.sign("HS256", sHeader, sPayload, SECRET_KEY);
    await fetch(`api/Users/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        tasks: encryptedTasks,
      }),
    });

    setTasks(await fetchTasks());
  }

  async function addTask() {
    if (newTaskTitle.current.value !== "" && newTaskDate.current.value !== "") {
      const newTask = {
        task: encryptString(newTaskTitle.current.value),
        date: encryptString(newTaskDate.current.value),
        reminder: newTaskReminder.current.checked,
      };

      const currentTasks = [...tasks];
      const encryptedTasks = currentTasks.map((task) => {
        const newTask = encryptString(task.task);
        const newDate = encryptString(task.date);
        return {
          reminder: task.reminder,
          _id: task._id,
          task: newTask,
          date: newDate,
        };
      });
      encryptedTasks.push(newTask);

      const SECRET_KEY = ENCRYPTION_KEY;
      const payload = {
        apiKey: process.env.REACT_APP_API_KEY,
        exp: Math.floor(Date.now() / 1000) + INTERVAL,
      };
      const header = { alg: "HS256", typ: "JWT" };
      const sHeader = JSON.stringify(header);
      const sPayload = JSON.stringify(payload);
      const token = jwt.jws.JWS.sign("HS256", sHeader, sPayload, SECRET_KEY);
      await fetch(`api/Users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tasks: encryptedTasks,
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
      task: encryptString(editedTaskTitle),
      date: encryptString(editedTaskDate),
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
    await fetch(`api/Users/${userId}`, {
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

    if (
      !document.cookie
        .split("; ")
        .find((row) => row.startsWith("authToken="))
        ?.split("=")[1]
    ) {
      getPeople();
      if(usernameBox.current) {
        usernameBox.current.focus()
      }
    }
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
    const res = await fetch(`api/Users/${userId}`, {
      methpd: "GET",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    const data = res.json();
    return data.then((res) =>
      res.tasks.map((task) => {
        const newTask = decryptString(task.task);
        const newDate = decryptString(task.date);
        return {
          reminder: task.reminder,
          _id: task._id,
          task: newTask,
          date: newDate,
        };
      })
    );
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
    return data;
  }

  async function checkIfSignedIn() {
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

      if (decrypt2 === "") {
        console.log("invalid auth token");
        deleteCookie("authToken");
        window.location.reload();
      }

      const res = await fetch(`api/Users/${decrypt2}`, {
        method: "GET",
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      console.log("Response status:", res.status);

      if (res.ok) {
        console.log("ok");
        const data = await res.json();
        setUser(decryptString(await data.name));
        setSignedIn(true);
        setTasks(
          (await data.tasks).map((task) => {
            const newTask = decryptString(task.task);
            const newDate = decryptString(task.date);
            return {
              reminder: task.reminder,
              _id: task._id,
              task: newTask,
              date: newDate,
            };
          })
        );
      } else if (res.status === 404) {
        console.log("invalid auth token");
        deleteCookie("authToken");
        window.location.reload();
      } else if (res.status === 401 || res.status === 500) {
        console.log("unauthorised");
        window.location.reload();
      }
    }
  }

  useEffect(() => {
    checkIfSignedIn();
  }, []);

  async function signIn(person, id) {
    setIsPuttingPassword(true);
    setUser(person);
    setUserId(id);
  }

  async function addUser() {
    if (nameBeingAdded === "") {
      error("Name required");
    } else if (passwordBeingAdded === "") {
      error("Password required");
    } else if (
      people.every(
        (val) =>
          decryptString(val.name).toUpperCase() !==
            nameBeingAdded.toUpperCase() &&
          adminPasswordBeingAdded === ADMIN_PASSWORD
      )
    ) {
      error("That name is taken");
    } else {
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
      await fetch(`api/Users`, {
        method: "POST",
        headers: {
          "Content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: encryptString(nameBeingAdded),
          tasks: [],
          password: passwordBeingAdded,
          email: encryptString(emailBeingAdded),
        }),
      });
      setPeople(await fetchPeople());
      signOut();
    }
  }

  async function signOut() {
    setNewEmail("");
    setDataBeingChanged("");
    setAdminPasswordBeingAdded("");
    deleteCookie("authToken");
    setUsername("");
    setEmailBeingAdded("");
    setPasswordBeingAdded("");
    setNewPassword("");
    setOldPassword("");
    setPasswordBeingReset("");
    setPasswordBeingAdded("");
    setIsResettingPassword(false);
    verificationCode = Math.floor(Math.random() * 1000000000);
    setCodeBeingInputted("");
    setIsChangingData(false);
    setNameBeingAdded("");
    setIsAdding(false);
    setIsAddingUser(false);
    setIsEditing(false);
    setIsPuttingPassword(false);
    setSignedIn(false);
    setPeople(await fetchPeople());
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
    await fetch(`api/Users/${userId}`, {
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
        await fetch(`api/Users/${userId}`, {
          method: "GET",
          headers: {
            authorization: `Bearer ${token}`,
          },
        })
      ).json()
    ).password;
    if (passwordBeingAdded === ADMIN_PASSWORD || await bcrypt.compare(passwordBeingAdded, password)) {
      passwordBox.current.type = "password";
      const FIRST_ENCRYPTION = CryptoJS.AES.encrypt(
        userId,
        stringSessionKey1
      ).toString();
      const SECOND_ENCRYPTION = CryptoJS.AES.encrypt(
        FIRST_ENCRYPTION,
        stringSessionKey2
      ).toString();
      let currentDate = new Date();
      let expirationDate = new Date(
        currentDate.getTime() + 7 * 24 * 60 * 60 * 1000
      ); // 7 days * 24 hours * 60 minutes * 60 seconds * 1000 milliseconds
      let expires = expirationDate.toUTCString();
      document.cookie = `authToken=${SECOND_ENCRYPTION}; expires=${expires}; path=/`;
      setSignedIn(true);
    }
    else {
      error("Incorrect password");
    }
  }

  function changePassword() {
    setIsAdding(false);
    setIsEditing(false);
    signOut();
    setIsChangingData(true);
    setDataBeingChanged("password");
  }

  function changeEmail() {
    setIsAdding(false);
    setIsEditing(false);
    signOut();
    setIsChangingData(true);
    setDataBeingChanged("email");
  }

  async function completeChangePassword() {
    if (oldPassword === "" || newPassword === "") {
      error("Value required");
      return;
    }
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
        await fetch(`api/Users/${userId}`, {
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
      await fetch(`api/Users/${userId}`, {
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
    } else {
      error("Incorrect password");
    }
  }

  useEffect(() => {
    if (passwordBox.current) {
      passwordBox.current.focus();
    }
  }, [isPuttingPassword]);

  useEffect(() => {
    if (isChangingData === "password" && oldPassword.current) {
      oldPasswordBox.current.focus();
    }
    if (isChangingData === "email" && newEmailBox.current) {
      newEmailBox.current.focus();
    }
  }, [isChangingData]);

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
      if (isChangingData && newPasswordBox.current === document.activeElement) {
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
      if (newEmailBox.current === document.activeElement) {
        completeChangeEmail();
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
    const SECRET_KEY = ENCRYPTION_KEY;
    const payload = {
      apiKey: process.env.REACT_APP_API_KEY,
      exp: Math.floor(Date.now() / 1000) + INTERVAL,
    };
    const header = { alg: "HS256", typ: "JWT" };
    const sHeader = JSON.stringify(header);
    const sPayload = JSON.stringify(payload);
    const token = jwt.jws.JWS.sign("HS256", sHeader, sPayload, SECRET_KEY);
    const formData = {
      code: verificationCode,
      user_name: decryptString(user),
      user_email: decryptString(
        (
          await (
            await fetch(`api/Users/${userId}`, {
              method: "GET",
              headers: {
                authorization: `Bearer ${token}`,
              },
            })
          ).json()
        ).email
      ),
    };
    setIsForgettingPassword(true);
    emailjs
      .send(
        process.env.REACT_APP_SERVICE_ID,
        process.env.REACT_APP_TEMPLATE_ID,
        formData,
        process.env.REACT_APP_PUBLIC_KEY
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
    await fetch(`api/Users/${userId}`, {
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
      setUsername("");
    }
    if (page === "changePassword") {
      setIsChangingData(false);
      setSignedIn(true);
    }
    if (page === "addingUser") {
      setAdminPasswordBeingAdded("");
      setEmailBeingAdded("");
      setNameBeingAdded("");
      setPasswordBeingAdded("");
      setIsAddingUser(false);
    }
    if (page === "forgetPassword") {
      setIsForgettingPassword(false);
      setIsPuttingPassword(false);
    }
    if (page === "changeEmail") {
      setIsChangingData(false);
      setDataBeingChanged("");
      setEmailBeingAdded("");
      setNewEmail("");
      setSignedIn(true);
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
          decryptString(
            (
              await (
                await fetch(`api/Users/${userId}`, {
                  method: "GET",
                  headers: {
                    authorization: `Bearer ${token}`,
                  },
                })
              ).json()
            ).email
          )
        );
      }
    }

    getEmail();
  }, [userId, isForgettingPassword, isChangingData]);

  function deleteCookie(cookieName) {
    document.cookie =
      cookieName + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  }

  return (
    <div className="app">
      <>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          limit={5}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
        {signedIn ? (
          <>
            <div className="container">
              <div className="header">
                <h1 className="title">Task Tracker</h1>
                <button
                  className={isAdding ? "button red" : "button green"}
                  onClick={() => isEditing === false && setIsAdding(!isAdding)}
                >
                  {isAdding ? "Close" : "Add"}
                </button>
              </div>
              {isAdding || isEditing ? (
                <div className={isAdding ? "addTask" : "editTask"}>
                  <label
                    className={isAdding ? "addTaskLabel" : "editTaskLabel"}
                    htmlFor="task"
                  >
                    Task
                  </label>
                  <input
                    autoComplete="off"
                    ref={isAdding ? newTaskTitle : null}
                    className={isAdding ? "addTaskInput" : "editTaskInput"}
                    value={isEditing ? editedTaskTitle : undefined}
                    onChange={(e) =>
                      isEditing && setEditedTaskTitle(e.target.value)
                    }
                    type="text"
                    placeholder={isAdding ? "Doctors Appoinment" : null}
                    id="task"
                  />
                  <label
                    className={isAdding ? "addTaskLabel" : "editTaskLabel"}
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
                    className={isAdding ? "addTaskInput" : "editTaskInput"}
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
                      className={isAdding ? "addTaskLabel" : "editTaskLabel"}
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
                        isEditing && setEditedTaskReminder(e.target.checked)
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
              <>
                {tasks.length !== 0 ? (
                  tasks.map((task, index) => (
                    <div
                      key={Math.random()}
                      className={task.reminder ? "task reminder" : "task"}
                    >
                      <p className="taskName">{task.task}</p>
                      <p className="taskDate">{task.date}</p>
                      <div className="buttons">
                        <button
                          className="button green edit-button"
                          onClick={() => edit(index)}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteTask(index)}
                          className="button red edit-button"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="noTasks">No tasks</p>
                )}
              </>

              <div className="signOutButtons">
                <button
                  className="signOutButton notWide"
                  onClick={changePassword}
                >
                  Change Password
                </button>
                <button onClick={changeEmail} className="signOutButton notWide">
                  Change Email
                </button>
              </div>
              <button
                className="signOutButton red wide"
                onClick={deleteAccount}
              >
                Delete Account
              </button>
              <button className="signOutButton green wide" onClick={signOut}>
                Sign Out
              </button>
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
                    type="text"
                  />
                  <label className="addUserName">Password:</label>
                  <input
                    ref={addUserPassword}
                    value={passwordBeingAdded}
                    onChange={(e) => setPasswordBeingAdded(e.target.value)}
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
                    onChange={(e) => setAdminPasswordBeingAdded(e.target.value)}
                    className="addUserInput show"
                    type="password"
                  />
                  <div
                    className="showButton"
                    onClick={() => showPassword("adminPassword")}
                  >
                    Show
                  </div>
                  <button onClick={addUser} className="signOutButton wide">
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
                            onClick={() => showPassword("resetPassword")}
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
                                <div className="backTriangle">{"<"}</div>
                                <div>Back</div>
                              </div>
                              <p>
                                We just sent a verification code to: {email}
                              </p>
                              <br />
                              <label>Code:</label>
                              <input
                                ref={codeBeingInputtedBox}
                                value={codeBeingInputted}
                                onChange={(e) =>
                                  setCodeBeingInputted(Number(e.target.value))
                                }
                                type="number"
                                className="addUserInput"
                                style={{"marginBottom": "10px"}}
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
                                <div className="backTriangle">{"<"}</div>
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

                              <div
                                className="forgotPassword"
                                onClick={() => forgotPassword()}
                              >
                                Forgot Password?
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {isChangingData ? (
                        <div>
                          {dataBeingChanged === "password" ? (
                            <>
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
                                onChange={(e) => setOldPassword(e.target.value)}
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
                                onChange={(e) => setNewPassword(e.target.value)}
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
                            </>
                          ) : (
                            <div>
                              <div
                                className="back"
                                onClick={() => back("changeEmail")}
                              >
                                <div className="backTriangle">{"<"}</div>
                                <div>Back</div>
                              </div>
                              <label className="addUserName">New email</label>
                              <input
                                ref={newEmailBox}
                                className="addUserInput"
                                value={newEmail}
                                type="text"
                                onChange={(e) => setNewEmail(e.target.value)}
                              />
                              <button
                                className="submitButton"
                                onClick={completeChangeEmail}
                              >
                                Submit
                              </button>
                            </div>
                          )}
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
                                  onChange={(e) => setUsername(e.target.value)}
                                  className="addUserInput"
                                  type="text"
                                />
                                <button
                                  className="submitPassword"
                                  onClick={signInUsername}
                                >
                                  Sign in
                                </button>
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
    </div>
  );
}

export default App;
