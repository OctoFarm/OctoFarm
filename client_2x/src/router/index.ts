import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import Dashboard from "../views/Dashboard.vue";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: "/",
    name: "Dashboard",
    icon: "mdi-view-dashboard-variant",
    component: Dashboard,
  },
   // {
  //   path: "/schedule",
  //   name: "Scheduler",
  //   icon: "mdi-calendar-text",
  //   component: JobQueues,
  // },
  {
    name: "Monitoring",
    icon: "mdi-eye",
    path: "/monitoring",
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/Monitoring.vue"),
  },
  {
    name: "File Manager",
    icon: "mdi-file-code",
    path: "/file-manager",
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/FileManager.vue"),
  },
  {
    name: "History",
    icon: "mdi-history",
    path: "/history",
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/History.vue"),
  },
  // {
  //   name: "Stock Manager",
  //   icon: "mdi-warehouse",
  //   path: "/stock",
  //   component: () =>
  //    import(/* webpackChunkName: "about" */ "../views/Monitoring.vue"),
  // },
  // {
  //   name: "Maintenance",
  //   icon: "mdi-hammer-wrench",
  //   path: "/maintenance",
  //   component: () =>
  //    import(/* webpackChunkName: "about" */ "../views/Monitoring.vue"),
  // },
  {
    name: "Printer Manager",
    icon: "mdi-printer-3d",
    path: "/printers",
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/admin/PrinterManager.vue"),
  },
  {
    name: "User Accounts",
    icon: "mdi-account-reactivate",
    path: "/admin/users",
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/admin/UserAccounts.vue"),
  },
  {
    name: "Notifications",
    icon: "mdi-shield-alert",
    path: "/admin/alerts",
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/admin/Notifications.vue"),
  },
  {
    name: "System Settings",
    icon: "mdi-cog",
    path: "/admin/server",
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/admin/SystemSettings.vue"),
  },
  {
    name: "Database Manager",
    icon: "mdi-database-edit",
    path: "/admin/database",
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/admin/DatabaseManager.vue"),
  },
  {
    name: "Logs",
    icon: "mdi-card-text",
    path: "/admin/logs",
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/admin/Logs.vue"),
  },
  {
    name: "About",
    icon: "mdi-information",
    path: "/about",
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/About.vue"),
  },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

export default router;
