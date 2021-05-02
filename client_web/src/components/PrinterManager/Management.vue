<template>
  <v-row>
    <v-col
      cols="12"
      md="6"
      lg="4"
      xl="3"
    >
      <management-card />
    </v-col>
    <v-col
      cols="12"
      md="6"
      lg="4"
      xl="3"
    >
      <octoprint-card />
    </v-col>
  </v-row>
</template>

<script>
import BulkPrinterActions from "@/components/PrinterManager/Management/UniversalPrinterActions/BulkPrinterActions.vue";
import BulkOctoPrintActions from "@/components/PrinterManager/Management/OctoPrintActions/BulkOctoPrintActions.vue";

export default {
  name: "Management",
  components: { "management-card": BulkPrinterActions, "octoprint-card": BulkOctoPrintActions },
};
</script>
