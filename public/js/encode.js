function encodeSpecialCharacters(name) {
    // Thay thế các kí tự đặc biệt bằng dấu -
    const replacedName = name.replace(/[^\w\s]/gi, '-');
    // Mã hóa tên sản phẩm và trả về
    return encodeURIComponent(replacedName);
  }