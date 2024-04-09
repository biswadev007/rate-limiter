for (let i = 1; i < 1200; i++) {
  fetch('http://localhost:4000')
    .then((res) => res.json())
    .then((data) => console.log(data))
    .catch((err) => console.log(err));
}
