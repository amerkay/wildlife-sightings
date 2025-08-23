import { computed, type Ref } from "vue";
import { useFormContext } from "vee-validate";

export interface LocationFormOptions {
  name: string;
  defaultLat: number;
  defaultLng: number;
}

export function useLocationForm(
  centerLat: Ref<number>,
  centerLng: Ref<number>,
  options: LocationFormOptions
) {
  const { setFieldValue, setFieldTouched } = useFormContext();

  const field = (s: string) => `${options.name}.${s}`;

  const isAtDefault = computed(
    () =>
      Math.abs(centerLat.value - options.defaultLat) < 0.0001 &&
      Math.abs(centerLng.value - options.defaultLng) < 0.0001
  );

  function syncFormFields() {
    if (isAtDefault.value) {
      setFieldValue(field("lat"), null);
      setFieldValue(field("lng"), null);
    } else {
      setFieldValue(field("lat"), centerLat.value);
      setFieldValue(field("lng"), centerLng.value);
    }
    setFieldTouched(field("lat"), true);
    setFieldTouched(field("lng"), true);
  }

  return {
    syncFormFields,
    isAtDefault,
    field,
  };
}
