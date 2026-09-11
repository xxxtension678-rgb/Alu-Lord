/* =========================================================
   SLW PRO
   Engineering + Cutting + Price
========================================================= */


/* ---------------------------------------------------------
   DEFAULT SECTION DATABASE
--------------------------------------------------------- */

const DEFAULT_SECTIONS = {

  topFrame: {
    name: "Top Frame",
    topFixedName: "Top Frame + Fixed",
    price: 0,
    stock: 20
  },

  botFrame: {
    name: "Bot Frame",
    price: 0,
    stock: 20
  },

  sideFrame: {
    name: "Side Frame",
    price: 0,
    stock: 20
  },

  lockFrame: {
    name: "Lock Frame",
    price: 0,
    stock: 20
  },

  hookFrame: {
    name: "Hook Frame",
    price: 0,
    stock: 20
  },

  wheelFrame: {
    name: "Wheel Frame",
    price: 0,
    stock: 20
  },

  fixedFrame: {
    name: "Fixed Frame",
    price: 0,
    stock: 20
  },

  fixedMiddle: {
    name: "Fixed Middle Frame",
    price: 0,
    stock: 20
  },

  sideFixedInner: {
    name: "Side Fixed Close (Inner)",
    price: 0,
    stock: 20
  },

  sideFixedOuter: {
    name: "Side Fixed Close (Outer)",
    price: 0,
    stock: 20
  },

  fixedClickDoor: {
    name: "Fixed Click — Door Width",
    price: 0,
    stock: 20
  },

  fixedClickHeight: {
    name: "Fixed Click — Fixed Height",
    price: 0,
    stock: 20
  }

};


/* ---------------------------------------------------------
   APP STATE
--------------------------------------------------------- */

let sections = loadData(
  "slw_sections",
  DEFAULT_SECTIONS
);

let settings = loadData(
  "slw_settings",
  {
    kerf: 0,
    sheetWidth: 4,
    sheetHeight: 8,
    glassPrice: 0,
    labourPrice: 0,
    profitPercent: 0
  }
);

let currentCalculation = null;


/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */

function $(id) {
  return document.getElementById(id);
}


function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}


function loadData(key, fallback) {

  try {

    const value = localStorage.getItem(key);

    if (!value) {
      return structuredClone(fallback);
    }

    return JSON.parse(value);

  } catch {

    return structuredClone(fallback);

  }
}


/* ---------------------------------------------------------
   LENGTH PARSER
   Internal unit = decimal feet
--------------------------------------------------------- */

function parseLength(value) {

  if (value === null || value === undefined) {
    return 0;
  }

  let s = String(value)
    .trim()
    .replace(/’/g, "'")
    .replace(/"/g, "");

  if (!s) return 0;


  /*
    Examples:

    4'
    4
    4'6
    4' 6
    1'6"
  */

  const feetMatch = s.match(
    /^(\d+(?:\.\d+)?)\s*'\s*(.*)$/
  );

  if (feetMatch) {

    const feet = Number(feetMatch[1]);

    const inchText = feetMatch[2].trim();

    if (!inchText) {
      return feet;
    }

    return feet + parseInches(inchText) / 12;
  }


  /*
    Decimal feet
  */

  if (/^\d+(?:\.\d+)?$/.test(s)) {
    return Number(s);
  }

  return 0;
}


function parseInches(value) {

  const s = String(value).trim();

  if (!s) return 0;


  /*
    6
    6 1/2
    1/2
  */

  const mixed = s.match(
    /^(\d+)?\s*(?:(\d+)\s*\/\s*(\d+))?$/
  );

  if (mixed) {

    let result = Number(mixed[1] || 0);

    if (mixed[2] && mixed[3]) {

      result +=
        Number(mixed[2]) /
        Number(mixed[3]);

    }

    return result;
  }

  return Number(s) || 0;
}


/* ---------------------------------------------------------
   FORMAT LENGTH
--------------------------------------------------------- */

function formatLength(feet) {

  if (!Number.isFinite(feet)) {
    return "0'";
  }

  let wholeFeet = Math.floor(feet);

  let inches =
    (feet - wholeFeet) * 12;

  /*
    nearest 1/8"
  */

  let eighths =
    Math.round(inches * 8);

  let wholeInches =
    Math.floor(eighths / 8);

  let fraction =
    eighths % 8;


  if (wholeInches === 12) {

    wholeFeet++;
    wholeInches = 0;
    fraction = 0;

  }


  let inchText = "";

  if (wholeInches > 0 || fraction > 0) {

    inchText =
      wholeInches > 0
        ? String(wholeInches)
        : "";

    if (fraction > 0) {

      const gcd = gcdNumber(
        fraction,
        8
      );

      const n = fraction / gcd;
      const d = 8 / gcd;

      inchText +=
        (inchText ? " " : "") +
        `${n}/${d}`;

    }

    inchText += '"';
  }


  return (
    wholeFeet +
    "'" +
    (inchText ? " " + inchText : "")
  );
}


function gcdNumber(a, b) {

  while (b !== 0) {

    const t = b;

    b = a % b;
    a = t;

  }

  return a;
}


/* ---------------------------------------------------------
   MONEY
--------------------------------------------------------- */

function money(value) {

  return Number(value || 0)
    .toLocaleString("en-US") + " Ks";

}


/* ---------------------------------------------------------
   FIXED UI
--------------------------------------------------------- */

$("fixedType").addEventListener(
  "change",
  updateFixedInputs
);


function updateFixedInputs() {

  const type = $("fixedType").value;

  const hasTop =
    type === "top" ||
    type === "both";

  const hasBottom =
    type === "bottom" ||
    type === "both";


  $("fixedHeightBox")
    .classList.toggle(
      "hidden",
      type === "none"
    );

  $("topFixedBox")
    .classList.toggle(
      "hidden",
      !hasTop
    );

  $("bottomFixedBox")
    .classList.toggle(
      "hidden",
      !hasBottom
    );

}


/* ---------------------------------------------------------
   CALCULATE ENGINEERING
--------------------------------------------------------- */

function calculateSLW() {

  const W =
    parseLength(
      $("frameWidth").value
    );

  const H =
    parseLength(
      $("frameHeight").value
    );

  const panel =
    Number($("panel").value);

  const fixedType =
    $("fixedType").value;


  if (W <= 0 || H <= 0) {

    alert(
      "Frame Width and Frame Height are required."
    );

    return;

  }


  let topFixed = 0;
  let bottomFixed = 0;


  if (
    fixedType === "top" ||
    fixedType === "both"
  ) {

    topFixed =
      parseLength(
        $("topFixedHeight").value
      );

  }


  if (
    fixedType === "bottom" ||
    fixedType === "both"
  ) {

    bottomFixed =
      parseLength(
        $("bottomFixedHeight").value
      );

  }


  const doorWidth =
    W / panel;

  const doorHeight =
    H -
    topFixed -
    bottomFixed;


  if (doorHeight <= 0) {

    alert(
      "Fixed height cannot be greater than frame height."
    );

    return;

  }


  const leaves = panel;


  const rows = [];


  /*
    TOP FRAME
  */

  addSection(
    rows,
    fixedType === "top" ||
    fixedType === "both"
      ? "topFrameFixed"
      : "topFrame",
    W,
    1
  );


  /*
    BOT FRAME
  */

  addSection(
    rows,
    "botFrame",
    W,
    1
  );


  /*
    SIDE FRAME
  */

  addSection(
    rows,
    "sideFrame",
    H,
    2
  );


  /*
    LOCK FRAME
  */

  addSection(
    rows,
    "lockFrame",
    doorHeight,
    leaves
  );


  /*
    HOOK FRAME
  */

  addSection(
    rows,
    "hookFrame",
    doorHeight,
    leaves
  );


  /*
    WHEEL FRAME

    2 panel = 4
    4 panel = 8
  */

  addSection(
    rows,
    "wheelFrame",
    doorWidth,
    leaves * 2
  );


  /*
    FIXED
  */

  if (fixedType !== "none") {

    const fixedCount =
      fixedType === "both"
        ? 2
        : 1;


    /*
      Fixed Frame
    */

    addSection(
      rows,
      "fixedFrame",
      W,
      fixedCount
    );


    /*
      Fixed Middle Frame

      2 Panel = 1
      4 Panel = 2

      Per fixed section.
    */

    const middleCount =
      panel === 2
        ? 1
        : 2;

    addSection(
      rows,
      "fixedMiddle",
      topFixed || bottomFixed,
      middleCount * fixedCount
    );


    /*
      Side Fixed Close Inner

      One fixed = 2
      Both fixed = 4
    */

    addSection(
      rows,
      "sideFixedInner",
      topFixed || bottomFixed,
      fixedCount * 2
    );


    /*
      Bottom Fixed only / Both

      Outer = frame width × 1
    */

    if (
      fixedType === "bottom" ||
      fixedType === "both"
    ) {

      addSection(
        rows,
        "sideFixedOuter",
        W,
        1
      );

    }


    /*
      FIXED CLICK

      2 panel:
        Door width = 4
        Fixed height = 4

      4 panel:
        Door width = 8
        Fixed height = 8
    */

    const clickQty =
      panel === 2
        ? 4
        : 8;


    /*
      For BOTH:
      There are top + bottom fixed sections.

      The user's specified rule gives
      the same click quantity per dimension
      for the fixed assembly, so combine
      both fixed heights as separate pieces.
    */

    if (fixedType === "both") {

      addSection(
        rows,
        "fixedClickDoor",
        doorWidth,
        clickQty
      );

      addSection(
        rows,
        "fixedClickHeight",
        topFixed,
        clickQty
      );

      addSection(
        rows,
        "fixedClickHeight",
        bottomFixed,
        clickQty
      );

    } else {

      const fh =
        topFixed || bottomFixed;

      addSection(
        rows,
        "fixedClickDoor",
        doorWidth,
        clickQty
      );

      addSection(
        rows,
        "fixedClickHeight",
        fh,
        clickQty
      );

    }

  }


  /*
    GLASS
  */

  const glass = [];


  /*
    Door glass

    Each leaf has one glass.
  */

  for (
    let i = 0;
    i < leaves;
    i++
  ) {

    glass.push({
      type: "Door Glass",
      width: doorWidth,
      height: doorHeight
    });

  }


  /*
    Top fixed glass
  */

  if (topFixed > 0) {

    for (
      let i = 0;
      i < leaves;
      i++
    ) {

      glass.push({
        type: "Top Fixed Glass",
        width: doorWidth,
        height: topFixed
      });

    }

  }


  /*
    Bottom fixed glass
  */

  if (bottomFixed > 0) {

    for (
      let i = 0;
      i < leaves;
      i++
    ) {

      glass.push({
        type: "Bottom Fixed Glass",
        width: doorWidth,
        height: bottomFixed
      });

    }

  }


  /*
    SAVE RESULT
  */

  currentCalculation = {
    width: W,
    height: H,
    panel,
    fixedType,
    topFixed,
    bottomFixed,
    doorWidth,
    doorHeight,
    leaves,
    rows,
    glass
  };


  renderResult();

}


/* ---------------------------------------------------------
   ADD SECTION
--------------------------------------------------------- */

function addSection(
  rows,
  key,
  length,
  qty
) {

  if (!length || !qty) return;


  /*
    topFrameFixed uses same
    database item as top frame
    but different display name.
  */

  let actualKey = key;

  if (key === "topFrameFixed") {
    actualKey = "topFrame";
  }


  const data =
    sections[actualKey];


  if (!data) return;


  rows.push({

    key: actualKey,

    name:
      key === "topFrameFixed"
        ? data.topFixedName
        : data.name,

    length,
    qty,

    price: Number(data.price) || 0,

    stock:
      Number(data.stock) || 20

  });

}


/* ---------------------------------------------------------
   COMBINE SAME CUT LENGTHS
--------------------------------------------------------- */

function groupedSections(rows) {

  const map = {};


  rows.forEach(row => {

    const key =
      row.key +
      "|" +
      row.name +
      "|" +
      row.length.toFixed(6);


    if (!map[key]) {

      map[key] = {
        ...row,
        qty: 0
      };

    }


    map[key].qty += row.qty;

  });


  return Object.values(map);

}


/* ---------------------------------------------------------
   RESULT UI
--------------------------------------------------------- */

function renderResult() {

  const c =
    currentCalculation;


  $("summaryCard")
    .classList.remove("hidden");

  $("priceCard")
    .classList.remove("hidden");


  $("status").textContent =
    "Calculated";


  $("resultSize").textContent =
    `${formatLength(c.width)} × ${formatLength(c.height)}`;


  $("doorSize").textContent =
    `${formatLength(c.doorWidth)} × ${formatLength(c.doorHeight)}`;


  $("doorLeaves").textContent =
    c.leaves;


  const area =
    c.glass.reduce(
      (sum, g) =>
        sum + g.width * g.height,
      0
    );


  $("glassArea").textContent =
    area.toFixed(2) + " sqft";


  renderSections();

  renderGlass();

  calculatePrice();

}


/* ---------------------------------------------------------
   SECTION LIST
--------------------------------------------------------- */

function renderSections() {

  const rows =
    groupedSections(
      currentCalculation.rows
    );


  if (!rows.length) {

    $("sectionList").innerHTML =
      `<div class="empty">
        No sections.
      </div>`;

    return;

  }


  $("sectionList").innerHTML =
    rows.map((row, index) => {

      const totalLength =
        row.length * row.qty;


      return `
        <div
          class="list-item clickable"
          onclick="openCutting(${index})"
        >

          <div class="item-left">

            <div class="item-icon">
              ▤
            </div>

            <div>

              <div class="item-name">
                ${row.name}
              </div>

              <div class="item-sub">
                Cut ${formatLength(row.length)}
              </div>

            </div>

          </div>

          <div class="item-qty">

            <strong>
              ${row.qty}
            </strong>

            <small>
              ${formatLength(totalLength)}
            </small>

          </div>

        </div>
      `;

    }).join("");


  window.sectionRows =
    rows;

}


/* ---------------------------------------------------------
   LINEAR CUTTING OPTIMIZER
--------------------------------------------------------- */

function optimizeLinear(
  pieces,
  stock,
  kerf
) {

  /*
    First Fit Decreasing

    This is a simple optimizer.
    It will be improved later if needed.
  */

  const sorted =
    [...pieces].sort(
      (a, b) => b - a
    );


  const bars = [];


  sorted.forEach(piece => {

    let placed = false;


    for (
      const bar of bars
    ) {

      const extraKerf =
        bar.pieces.length
          ? kerf
          : 0;


      if (
        bar.used +
        extraKerf +
        piece <=
        stock + 0.000001
      ) {

        bar.used +=
          extraKerf + piece;

        bar.pieces.push(piece);

        placed = true;

        break;

      }

    }


    if (!placed) {

      bars.push({

        used: piece,

        pieces: [piece]

      });

    }

  });


  return bars;

}


/* ---------------------------------------------------------
   OPEN CUTTING DETAIL
--------------------------------------------------------- */

function openCutting(index) {

  const rows =
    window.sectionRows || [];

  const row =
    rows[index];


  if (!row) return;


  const pieces =
    Array(row.qty)
      .fill(row.length);


  const bars =
    optimizeLinear(
      pieces,
      row.stock,
      Number(settings.kerf) || 0
    );


  $("cutTitle").textContent =
    row.name;


  $("cutSubtitle").textContent =
    `Required ${row.qty} pcs • Cut ${formatLength(row.length)} • Stock ${formatLength(row.stock)}`;


  let totalUsed = 0;


  bars.forEach(bar => {
    totalUsed += bar.used;
  });


  const totalStock =
    bars.length * row.stock;


  const waste =
    Math.max(
      0,
      totalStock - totalUsed
    );


  let html = `

    <div class="cut-summary">

      <div class="cut-stat">
        <small>Required Pieces</small>
        <strong>${row.qty}</strong>
      </div>

      <div class="cut-stat">
        <small>Stock Bars</small>
        <strong>${bars.length}</strong>
      </div>

      <div class="cut-stat">
        <small>Total Waste</small>
        <strong>${formatLength(waste)}</strong>
      </div>

    </div>

  `;


  bars.forEach(
    (bar, barIndex) => {

      const waste =
        row.stock - bar.used;


      html += `

        <div class="bar-card">

          <div class="bar-title">

            <b>
              Bar #${barIndex + 1}
            </b>

            <span>
              Used ${formatLength(bar.used)}
              /
              ${formatLength(row.stock)}
            </span>

          </div>

          <div class="bar-track">
      `;


      bar.pieces.forEach(
        piece => {

          const percent =
            Math.max(
              6,
              piece /
              row.stock *
              100
            );


          html += `

            <div
              class="bar-piece"
              style="width:${percent}%"
            >
              ${formatLength(piece)}
            </div>

          `;

        }
      );


      const wastePercent =
        Math.max(
          3,
          waste /
          row.stock *
          100
        );


      html += `

            <div
              class="bar-piece bar-waste"
              style="width:${wastePercent}%"
            >
              ${formatLength(waste)}
            </div>

          </div>

        </div>

      `;

    }
  );


  $("cutContent").innerHTML =
    html;


  $("cutModal")
    .classList.remove("hidden");

}


/* ---------------------------------------------------------
   GLASS LIST
--------------------------------------------------------- */

function renderGlass() {

  const glass =
    currentCalculation.glass;


  const groups = {};


  glass.forEach(g => {

    const key =
      g.type +
      "|" +
      g.width.toFixed(6) +
      "|" +
      g.height.toFixed(6);


    if (!groups[key]) {

      groups[key] = {
        ...g,
        qty: 0
      };

    }


    groups[key].qty++;

  });


  $("glassList").innerHTML =
    Object.values(groups)
      .map(g => {

        return `

          <div class="glass-piece">

            <div>
              <b>${g.type}</b>
            </div>

            <div>
              <span>
                ${formatLength(g.width)}
                ×
                ${formatLength(g.height)}
              </span>

              &nbsp;
              <b>× ${g.qty}</b>
            </div>

          </div>

        `;

      })
      .join("");


  renderSheetCutting();

}


/* ---------------------------------------------------------
   SHEET CUTTING
--------------------------------------------------------- */

function optimizeSheets(
  pieces,
  sheetW,
  sheetH,
  kerf
) {

  /*
    Simple shelf optimizer.

    Later this can be replaced with
    a stronger guillotine / 2D optimizer.
  */

  const sorted =
    [...pieces].sort(
      (a, b) =>
        (b.width * b.height) -
        (a.width * a.height)
    );


  const sheets = [];


  sorted.forEach(piece => {

    let placed = false;


    for (
      const sheet of sheets
    ) {

      /*
        Try normal orientation
      */

      if (
        placeOnSheet(
          sheet,
          piece,
          sheetW,
          sheetH,
          kerf
        )
      ) {

        placed = true;
        break;

      }


      /*
        Try rotated
      */

      const rotated = {

        ...piece,

        width: piece.height,
        height: piece.width

      };


      if (
        placeOnSheet(
          sheet,
          rotated,
          sheetW,
          sheetH,
          kerf
        )
      ) {

        placed = true;
        break;

      }

    }


    if (!placed) {

      const sheet = {

        rows: [],
        currentY: 0

      };


      placeOnSheet(
        sheet,
        piece,
        sheetW,
        sheetH,
        kerf
      );


      sheets.push(sheet);

    }

  });


  return sheets;

}


function placeOnSheet(
  sheet,
  piece,
  sheetW,
  sheetH,
  kerf
) {

  /*
    Shelf packing.
  */

  let row =
    sheet.rows[
      sheet.rows.length - 1
    ];


  if (
    !row ||
    row.usedWidth +
