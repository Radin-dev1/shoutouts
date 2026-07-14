const wall = document.querySelector("#wall");
const statusEl = document.querySelector("#wallStatus");
const setupNotice = document.querySelector("#setupNotice");
const template = document.querySelector("#noteTemplate");

const colors = ["#ffe177", "#ffb3ba", "#b9fbc0", "#a0c4ff", "#ffd6a5", "#cdb4db"];
const tilts = ["-1.6deg", "1.2deg", "-0.8deg", "1.8deg", "-1.1deg", "0.7deg"];
const sheetId = "1cOYX_POgtHxzt_WYxFEv1JxXOwP-9ASPYn1Ze_FCI1Q";
const sheetGid = "84917661";

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
    const shoutouts = await loadSheetShoutouts();
    const visibleShoutouts = shoutouts
      .filter((item) => cleanText(item.message || item.shoutout))
      .sort((a, b) => new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp));

    wall.replaceChildren();

    if (!visibleShoutouts.length) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "No shoutouts yet. Be the first to add one.";
      wall.append(empty);
      setupNotice.hidden = false;
      statusEl.textContent = "Ready for the first shoutout.";
      return;
    }

    setupNotice.hidden = true;
    visibleShoutouts.forEach((shoutout, index) => {
      wall.append(renderNote(shoutout, index));
    });

    statusEl.textContent = `${visibleShoutouts.length} shoutout${
      visibleShoutouts.length === 1 ? "" : "s"
    } on the wall.`;
  } catch (error) {
    console.error(error);
    statusEl.textContent = `The shoutout wall could not load yet: ${error.message}`;
  }
}

loadWall();

function loadSheetShoutouts() {
  return new Promise((resolve, reject) => {
    const callbackName = `handleShoutouts_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}`;
    const script = document.createElement("script");
    const query = "select A,B,C,D";
    const src = new URL(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq`);
    src.searchParams.set("gid", sheetGid);
    src.searchParams.set("tq", query);
    src.searchParams.set("tqx", `out:json;responseHandler:${callbackName}`);

    window[callbackName] = (response) => {
      cleanup();

      if (response.status !== "ok") {
        reject(new Error(response.errors?.[0]?.detailed_message || "Google Sheet returned an error"));
        return;
      }

      resolve(sheetRowsToShoutouts(response.table));
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("Could not load the Google Sheet"));
    };

    function cleanup() {
      delete window[callbackName];
      script.remove();
    }

    script.src = src.toString();
    document.head.append(script);
  });
}

function sheetRowsToShoutouts(table) {
  return (table.rows || []).map((row, index) => {
    const cells = row.c || [];
    return {
      id: `sheet-${index}`,
      createdAt: googleDateToIso(cells[0]?.v),
      sender: cells[1]?.v || "Anonymous",
      intensity: cells[2]?.v,
      message: cells[3]?.v || "",
    };
  });
}

function googleDateToIso(value) {
  const match = String(value || "").match(
    /^Date\((\d+),(\d+),(\d+),(\d+),(\d+),(\d+)\)$/
  );

  if (!match) return value;

  const [, year, month, day, hour, minute, second] = match.map(Number);
  return new Date(year, month, day, hour, minute, second).toISOString();
}
