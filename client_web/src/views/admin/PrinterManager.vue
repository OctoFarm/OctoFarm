<template>
  <v-container fluid>
    <v-row>
      <v-col align="center">
        <h1>{{ this.$route.name }}</h1>
      </v-col>
    </v-row>
    <v-row>
      <v-col align="center">
        <printer-table></printer-table>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
import PrinterTable from "@/components/PrinterManager/PrinterTable.vue";

export default {
  name: "PrinterManager",
  components: { "printer-table": PrinterTable },
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
        printer_firmware: "Klipper v9.0"
      }
    ]
  })
};
</script>
