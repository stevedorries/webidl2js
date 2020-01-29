export default {
  boolean: {
    get(objName, attrName) {
      return `return this[impl].hasAttributeNS(null, "${attrName}");`;
    },
    set(objName, attrName) {
      return `
      if (V) {
        this[impl].setAttributeNS(null, "${attrName}", "");
      } else {
        this[impl].removeAttributeNS(null, "${attrName}");
      }
    `;
    }
  },

  DOMString: {
    get(objName, attrName) {
      return `
      const value = this[impl].getAttributeNS(null, "${attrName}");
      return value === null ? "" : value;
    `;
    },
    set(objName, attrName) {
      return `this[impl].setAttributeNS(null, "${attrName}", V);`;
    }
  },

  long: {
    get(objName, attrName) {
      return `
      const value = parseInt(this[impl].getAttributeNS(null, "${attrName}"));
      return isNaN(value) || value < -2147483648 || value > 2147483647 ? 0 : value
    `;
    },
    set(objName, attrName) {
      return `this[impl].setAttributeNS(null, "${attrName}", String(V));`;
    }
  },

  "unsigned long": {
    get(objName, attrName) {
      return `
      const value = parseInt(this[impl].getAttributeNS(null, "${attrName}"));
      return isNaN(value) || value < 0 || value > 2147483647 ? 0 : value
    `;
    },
    set(objName, attrName) {
      return `this[impl].setAttributeNS(null, "${attrName}", String(V > 2147483647 ? 0 : V));`;
    }
  }
};
