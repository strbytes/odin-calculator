// ---- MODEL ----
// Calculator object -- stores state and calculator functionality
const Calculator = {
  // State
  // currOperation: Stores (as a higher-order function) the operator and first
  //   operand of an operation once an operator button is pressed
  // prevOperation: Stores (as a higher-order function) the operator and second
  //   operand from a completed operation to enable repeated operations with
  //   repeated pressing of the = key
  currOperation: null,
  prevOperation: null,

  // Methods
  newBinaryOperation: function (operator, x) {
    // Set the currOperation to a function that is executed when
    // Calculator.execute is called
    // Clear the previous operation when starting a new one
    Calculator.prevOperation = null;
    Calculator.currOperation = (y) => {
      // When executed, set prevOperation to repeat the current operation
      Calculator.newPrevOperation(operator, y);
      return BinaryOperators[operator](x, y);
    };
  },

  newPrevOperation: function (operator, y) {
    // Set prevOperation to enable repeating the previous operation
    Calculator.prevOperation = (x) => {
      return BinaryOperators[operator](x, y);
    };
  },
  applyUnaryOperation: function (operator, x) {
    // Apply unary operations immediately
    Screen.display(UnaryOperators[operator](x));
  },

  execute: function (y) {
    // Execute prevOperation if it exists
    if (Calculator.prevOperation) {
      Screen.display(Calculator.prevOperation(y));
    } else if (Calculator.currOperation) {
      // Else finish the current operation
      // Use 0 as the second operand if no new number has been entered
      if (Screen.newNum) y = 0;
      Screen.display(Calculator.currOperation(y));
    }
    Calculator.currOperation = null;
  },

  clear: function () {
    Calculator.currOperation = null;
    Calculator.prevOperation = null;
  },
};

// Store operations to be used by the calculator
const BinaryOperators = {
  add: (x, y) => x + y,
  sub: (x, y) => x - y,
  mul: (x, y) => x * y,
  div: (x, y) => {
    if (y === 0) return "ERR";
    return x / y;
  },
  mod: (x, y) => {
    if (y === 0) return "ERR";
    return x % y;
  },
  exp: (x, y) => x ** y,
};

const UnaryOperators = {
  inv: (x) => 1 / x,
  sqrt: (x) => Math.sqrt(x),
  log: (x) => Math.log(x),
};

// ---- VIEW ----
// Screen receives output of model and certain input from controls

const Screen = {
  // State
  // screenSelector: stores the #screen node
  // newNum: Set when an operation has been executed or the screen is cleared.
  //  Prevents adding digits to the results of operations. Currently does not
  //  work with unary operations.
  screenSelector: document.querySelector("#screen"),
  newNum: true,

  // Methods
  display: function (results) {
    // Set the screen to show the results of an operation
    Screen.screenSelector.textContent = this.trimResults(results);
  },
  read: function () {
    // Return the contents of the screen
    return Screen.screenSelector.textContent;
  },
  checkError: function () {
    // Return whether the screen is showing an error
    return Screen.read().includes("ERR") || Screen.read().includes("NaN");
  },

  trimResults: function (results) {
    // Format results to fit screen
    if (results.toString().includes("ERR")) {
      // Skip tests if results are an error
      return results;
    } else if (results.toExponential().split("e")[1] > 8) {
      // Represent large numbers using e notation
      results = results.toExponential(2);
    } else if (results.toExponential().split("e")[1] < -6) {
      // Represent small numbers using e notation
      results = results.toExponential(2);
    } else if (results.toString().length > 9) {
      // Truncate long decimals
      results = results.toString().substring(0, 8);
    }
    return results;
  },

  addDigit: function (num) {
    // Input new numbers to the screen
    if (Screen.newNum) {
      // Reset screen and prevOperation when entering next number
      Calculator.prevOperation = null;
      // Decimal as first digit of new number should keep the 0
      if (num === ".") {
        Screen.screenSelector.textContent = "0.";
      } else {
        // Otherwise eliminate leading 0
        Screen.screenSelector.textContent = num;
      }
      Screen.newNum = false;
    } else if (Screen.screenSelector.textContent.length === 9) {
      // If entered number would exceed the length of the screen, do nothing
      return;
    } else if (Screen.read() === "0") {
      // If screen is 0, reset it with next entered number
      // But only if the number is not 0 or the decimal marker
      if (num === ".") {
        Screen.screenSelector.textContent = "0.";
      } else if (num !== "0") {
        Screen.screenSelector.textContent = num;
      }
      // Otherwise, add the number to the end of the screen
    } else {
      Screen.screenSelector.textContent += num;
    }
  },

  toggleSign: function () {
    if (Screen.read()[0] === "-") {
      // Remove '-' if present
      Screen.screenSelector.textContent =
        Screen.screenSelector.textContent.substring(1);
    } else {
      // Add '-' if not present
      Screen.screenSelector.textContent =
        "-" + Screen.screenSelector.textContent;
    }
  },
  clearScreen: function () {
    Screen.screenSelector.textContent = 0;
  },
};

// ---- CONTROLLER ----
// No Controller object, just global selectors and listeners
// Buttons selectors divided by grouping (numbers, binary operators, clear, etc)

const numberButtons = document.querySelectorAll(".numbers");
numberButtons.forEach((numButton) => {
  numButton.addEventListener("click", numButtonPress);
});
function numButtonPress(event) {
  let num = event.target.id;
  Screen.addDigit(num);
}

const binaryOperatorButtons = document.querySelectorAll(".binaryOperators");
binaryOperatorButtons.forEach((binaryOperatorButton) => {
  binaryOperatorButton.addEventListener("click", binaryOperatorButtonPress);
});
function binaryOperatorButtonPress(event) {
  if (Screen.checkError()) {
    return; // Do nothing if error present
  }
  let operator = event.target.id;
  let num = +Screen.read();
  if (Calculator.currOperation) {
    // Chain operations by automatically executing partially-entered
    // operations if another operator button is pressed
    Calculator.execute(num);
    num = +Screen.read();
  }
  Calculator.newBinaryOperation(operator, num);
  Screen.newNum = true;
}

const unaryOperatorButtons = document.querySelector(".unaryOperators");
unaryOperatorButtons.addEventListener("click", unaryOperatorButtonPress);
function unaryOperatorButtonPress(event) {
  if (Screen.checkError()) return; // Do nothing if error
  else if (Screen.newNum) Calculator.clear();
  let operator = event.target.id;
  num = +Screen.read();
  Screen.display(UnaryOperators[operator](num));
  // Screen.newNum = true;
}

const equalsButton = document.querySelector("#equals");
equalsButton.addEventListener("click", equalsButtonPress);
function equalsButtonPress(_) {
  Calculator.execute(+Screen.read());
  Screen.newNum = true;
}

const clearButtons = document.querySelectorAll(".clear");
clearButtons.forEach((clearButton) => {
  clearButton.addEventListener("click", clearButtonPress);
});
function clearButtonPress(event) {
  // Clear the screen
  Screen.clearScreen();
  if (event.target.id == "C") {
    // Clear all
    Calculator.clear();
  }
}

const signButton = document.querySelector("#sign");
signButton.addEventListener("click", signButtonPress);
function signButtonPress(_) {
  // Don't toggle if screen is 0 or error
  if (Screen.read() === "0" || Screen.checkError()) {
    return;
  } else {
    Screen.toggleSign();
  }
}

const decimalButton = document.querySelector("#decimal");
decimalButton.addEventListener("click", decimalAdd);
function decimalAdd(_) {
  if (Screen.checkError()) return;
  if (!Screen.read().includes(".") && !Screen.checkError()) {
    // Only add a decimal if none present and no error
    Screen.addDigit(".");
  }
}
