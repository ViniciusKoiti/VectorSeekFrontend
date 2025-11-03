function of(...values) {
  return {
    subscribe(next) {
      values.forEach((value) => next(value));
      return { unsubscribe() {} };
    },
    pipe() {
      return this;
    }
  };
}

module.exports = {
  of,
};
