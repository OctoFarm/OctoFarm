const dayName = new Intl.DateTimeFormat(["en"], {
  weekday: "long" // ?? what should I put here
}).format(new Date());

module.exports = {
  emptyHeatmap: [
    {
      name: "Completed",
      data: [
        {
          x: "Wednesday",
          y: 0
        },
        {
          x: "Sunday",
          y: 0,
          figure: NaN
        }
      ]
    }
  ],
  nanFigureHeatmap: [
    {
      name: "Completed",
      data: [
        {
          x: dayName,
          y: 0,
          figure: NaN
        }
      ]
    },
    {
      name: "Active",
      data: [
        {
          x: dayName,
          y: 0,
          figure: NaN
        }
      ]
    },
    {
      name: "Idle",
      data: [
        {
          x: dayName,
          y: 0,
          figure: NaN
        }
      ]
    },
    {
      name: "Offline",
      data: [
        {
          x: dayName,
          y: 0,
          figure: NaN
        }
      ]
    },
    {
      name: "Disconnected",
      data: [
        {
          x: dayName,
          y: 0,
          figure: NaN
        }
      ]
    }
  ]
};
