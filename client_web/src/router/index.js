import Vue from "vue";
import VueRouter from "vue-router";
import Dashboard from "../views/Dashboard";
import PrinterManager from "../views/admin/PrinterManager.vue";
import Monitoring from "../views/Monitoring.vue";
import FileManager from "../views/FileManager.vue";
import History from "../views/History.vue";
import StockManager from "../views/StockManager.vue";
import Maintenance from "../views/Maintenance.vue";
import About from "../views/About.vue";
import Alerts from "../views/admin/Alerts.vue";
import DatabaseManager from "../views/admin/DatabaseManager.vue";
import Logs from "../views/admin/Alerts.vue";
import UserAccounts from "../views/admin/UserAccounts.vue";
import ServerSettings from "../views/admin/ServerSettings.vue";
import JobQueues from "../views/JobQueues.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Dashboard",
    icon: "mdi-view-dashboard-variant",
    component: Dashboard
  },
  {
    path: "/schedule",
    name: "Scheduler",
    icon: "mdi-calendar-text",
    component: JobQueues
  },
  {
    name: "Monitoring",
    icon: "mdi-eye",
    path: "/monitoring",
    component: Monitoring
  },
  {
    name: "File Manager",
    icon: "mdi-file-code",
    path: "/file-manager",
    component: FileManager
  },
  {
    name: "History",
    icon: "mdi-history",
    path: "/history",
    component: History
  },
  {
    name: "Stock Manager",
    icon: "mdi-warehouse",
    path: "/stock",
    component: StockManager
  },
  {
    name: "Maintenance",
    icon: "mdi-hammer-wrench",
    path: "/maintenance",
    component: Maintenance
  },
  {
    name: "Printer Manager",
    icon: "mdi-printer-3d",
    path: "/printers",
    component: PrinterManager
  },
  {
    name: "User Accounts",
    icon: "mdi-account-reactivate",
    path: "/admin/system",
    component: UserAccounts
  },
  {
    name: "Alerts",
    icon: "mdi-shield-alert",
    path: "/admin/alerts",
    component: Alerts
  },
  {
    name: "Server Settings",
    icon: "mdi-cog",
    path: "/admin/server",
    component: ServerSettings
  },
  {
    name: "Database Manager",
    icon: "mdi-database-edit",
    path: "/admin/database",
    component: DatabaseManager
  },
  {
    name: "Logs",
    icon: "mdi-card-text",
    path: "/admin/logs",
    component: Logs
  },
  {
    name: "About",
    icon: "mdi-information",
    path: "/about",
    component: About
  }
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes
});

export default router;
