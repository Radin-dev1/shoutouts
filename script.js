const wall = document.querySelector("#wall");
const statusEl = document.querySelector("#wallStatus");
const template = document.querySelector("#noteTemplate");

const colors = ["#ffe177", "#ffb3ba", "#b9fbc0", "#a0c4ff", "#ffd6a5", "#cdb4db"];
const tilts = ["-1.6deg", "1.2deg", "-0.8deg", "1.8deg", "-1.1deg", "0.7deg"];

function cleanText(value, fallback = "") {
  return String(value || fallback).trim();
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function renderNote(shoutout, index) {
  const node = template.content.firstElementChild.cloneNode(true);
  const message = cleanText(shoutout.message || shoutout.shoutout);
  const recipient = cleanText(shoutout.recipient || shoutout.to);
  const sender = cleanText(shoutout.sender || shoutout.from, "Anonymous");
  const intensity = cleanText(shoutout.intensity || shoutout.rating);
  const date = formatDate(shoutout.createdAt || shoutout.timestamp);

  node.style.setProperty("--note-color", colors[index % colors.length]);
  node.style.setProperty("--tilt", tilts[index % tilts.length]);
  node.querySelector(".message").textContent = recipient ? `${recipient}: ${message}` : message;
  node.querySelector(".from").textContent = `From ${sender}`;
  node.querySelector(".date").textContent = intensity ? `${intensity}/10` : date;
  node.title = date ? `Posted ${date}` : "";

  return node;
}

async function loadWall() {
  try {
    const response = await fetch(`data/shoutouts.json?ts=${Date.now()}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Could not load shoutouts (${response.status})`);
    }

    const shoutouts = await response.json();
    const visibleShoutouts = shoutouts
      .filter((item) => cleanText(item.message || item.shoutout))
      .sort((a, b) => new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp));

    wall.replaceChildren();

    if (!visibleShoutouts.length) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "No shoutouts yet. Be the first to add one.";
      wall.append(empty);
      statusEl.textContent = "Ready for the first shoutout.";
      return;
    }

    visibleShoutouts.forEach((shoutout, index) => {
      wall.append(renderNote(shoutout, index));
    });

    statusEl.textContent = `${visibleShoutouts.length} shoutout${
      visibleShoutouts.length === 1 ? "" : "s"
    } on the wall.`;
  } catch (error) {
    console.error(error);
    statusEl.textContent = "The shoutout wall could not load yet.";
  }
}

loadWall();
