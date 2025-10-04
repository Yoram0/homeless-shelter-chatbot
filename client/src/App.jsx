import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

function App() {
  const [title, setTitle] = useState("default value");

  useEffect(() => {
    fetch("http://localhost:8080/")
      .then((response) => response.text())
      .then((text) => setTitle(text))
      .catch((error) => console.log("Error fetching", error));
  }, []);

  return (
    <>
      <h1>React + {title}</h1>
    </>
  );
}

export default App;
