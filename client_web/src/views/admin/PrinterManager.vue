<template>
  <v-container fluid>
    <v-row no-gutters>
      <printer-management />
    </v-row>
    <v-row>
      <printer-table />
    </v-row>
  </v-container>
</template>
<script>
import PrinterTable from "@/components/PrinterManager/PrinterTable.vue";
import Management from "@/components/PrinterManager/Management.vue";

export default {
  name: "PrinterManager",
  components: { "printer-table": PrinterTable, "printer-management": Management },
  data: () => ({
    printers: [
      {
        _id: "blablabla",
        sort_index: 0,
        type: "FDM",
        link: "OctoPrint",
        name: "Bog Saget",
        url: "http://192.168.1.124:5001",
        apikey: "blablablabla",
        host_state: "online",
        printer_state: "disconnected",
        websocket_state: "connected",
        group: "UPS1",
        octoprint_version: "1.5.3",
        printer_firmware: "Klipper v9.0",
      },
    ],
  }),
};
</script>
