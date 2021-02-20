<template>
  <v-row>
    <v-col
      cols="12"
      md="6"
      lg="3"
      xl="4"
    >
      <management-card />
    </v-col>
    <v-col
      cols="12"
      md="6"
      lg="3"
      xl="4"
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
