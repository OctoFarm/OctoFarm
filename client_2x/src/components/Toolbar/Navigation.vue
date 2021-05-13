<template>
  <v-list
    nav
    dense
  >
    <span
      v-for="(nav, i) in navigation"
      :key="i"
    >
      <v-list-item-group color="primary">
        <v-list-item
          :to="nav.path"
          @click="toggle_tool_bar(true)"
        >
          <v-list-item-icon>
            <v-icon v-text="nav.icon" />
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title v-text="nav.name" />
          </v-list-item-content>
        </v-list-item>
      </v-list-item-group>
    </span>
  </v-list>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component({
  name: "Navigation",
})

export default class Toolbar extends Vue {
    private navigation: Array<unknown> = []
    private toggle_tool_bar(toggle: boolean){
        this.$emit("update_nav_drawer", toggle)
    }
    beforeMount(){
        this.navigation = this.$router.options.routes ?? [];
    }
};
</script>