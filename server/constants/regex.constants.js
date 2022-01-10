module.exports = {
  OP_PLUGIN_DISPLAY_LAYER: {
    currentLayerRegex: /(?<=\L=)(.*?)(?=\/)/,
    totalLayerRegex: /(?<=\/)(.*?)(?=&)/,
    currentPercentRegex: /(?<=;)(.*?)(?=%)/
  }
};
