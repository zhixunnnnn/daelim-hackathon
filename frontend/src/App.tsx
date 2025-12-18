import { useState, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

interface Item {
  id: number;
  name: string;
  description: string;
}

function App() {
  const [message, setMessage] = useState<string>("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchHello = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/hello");
      const data = await response.json();
      setMessage(data.message);
    } catch (error) {
      console.error("Error fetching hello:", error);
      setMessage("Error connecting to backend");
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/data");
      const data = await response.json();
      setItems(data.items);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHello();
    fetchData();
  }, []);

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>React + TypeScript + Python</h1>

      <div className="card">
        <h2>Backend Message</h2>
        {loading ? <p>Loading...</p> : <p>{message || "No message yet"}</p>}
        <button onClick={fetchHello}>Fetch Message</button>
      </div>

      <div className="card">
        <h2>Data from Backend</h2>
        {items.length > 0 ? (
          <ul
            style={{ textAlign: "left", maxWidth: "400px", margin: "0 auto" }}
          >
            {items.map((item) => (
              <li key={item.id}>
                <strong>{item.name}</strong>: {item.description}
              </li>
            ))}
          </ul>
        ) : (
          <p>No items loaded</p>
        )}
        <button onClick={fetchData}>Refresh Data</button>
      </div>
    </>
  );
}

export default App;
