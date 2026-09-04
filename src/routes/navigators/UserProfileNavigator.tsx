import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { withSoftOrangeGlow } from "../../components/SoftOrangeGlowBackdrop";
import UserProfileTabScreen from "../../pages/profile/UserProfileTabScreen";
import AparienciaScreen from "../../pages/profile/AparienciaScreen";
import MisRegistrosScreen from "../../pages/profile/MisRegistrosScreen";
import MisPermisosScreen from "../../pages/profile/MisPermisosScreen";
import NuevoPermisoScreen from "../../pages/profile/NuevoPermisoScreen";
import PermisoDetalleScreen from "../../pages/profile/PermisoDetalleScreen";
import MisVacacionesScreen from "../../pages/profile/MisVacacionesScreen";
import NuevaVacacionScreen from "../../pages/profile/NuevaVacacionScreen";
import MisIncapacidadesScreen from "../../pages/profile/MisIncapacidadesScreen";
import NuevaIncapacidadScreen from "../../pages/profile/NuevaIncapacidadScreen";
import IncapacidadDetalleScreen from "../../pages/profile/IncapacidadDetalleScreen";
import MisExpedienteScreen from "../../pages/profile/MisExpedienteScreen";
import MisExpedienteDocumentoScreen from "../../pages/profile/MisExpedienteDocumentoScreen";
import MisComisionesScreen from "../../pages/profile/MisComisionesScreen";

const Stack = createNativeStackNavigator();
const GlowUserProfile = withSoftOrangeGlow(UserProfileTabScreen);
const GlowApariencia = withSoftOrangeGlow(AparienciaScreen);
const GlowRegistros = withSoftOrangeGlow(MisRegistrosScreen);
const GlowPermisos = withSoftOrangeGlow(MisPermisosScreen);
const GlowNuevoPermiso = withSoftOrangeGlow(NuevoPermisoScreen);
const GlowPermisoDetalle = withSoftOrangeGlow(PermisoDetalleScreen);
const GlowVacaciones = withSoftOrangeGlow(MisVacacionesScreen);
const GlowNuevaVacacion = withSoftOrangeGlow(NuevaVacacionScreen);
const GlowIncapacidades = withSoftOrangeGlow(MisIncapacidadesScreen);
const GlowNuevaIncapacidad = withSoftOrangeGlow(NuevaIncapacidadScreen);
const GlowIncapacidadDetalle = withSoftOrangeGlow(IncapacidadDetalleScreen);
const GlowExpediente = withSoftOrangeGlow(MisExpedienteScreen);
const GlowExpedienteDocumento = withSoftOrangeGlow(MisExpedienteDocumentoScreen);
const GlowComisiones = withSoftOrangeGlow(MisComisionesScreen);

export default function UserProfileNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="UserProfileMain" component={GlowUserProfile} />
      <Stack.Screen name="Apariencia" component={GlowApariencia} />
      <Stack.Screen name="MisRegistros" component={GlowRegistros} />
      <Stack.Screen name="MisPermisos" component={GlowPermisos} />
      <Stack.Screen name="NuevoPermiso" component={GlowNuevoPermiso} />
      <Stack.Screen name="PermisoDetalle" component={GlowPermisoDetalle} />
      <Stack.Screen name="MisVacaciones" component={GlowVacaciones} />
      <Stack.Screen name="NuevaVacacion" component={GlowNuevaVacacion} />
      <Stack.Screen name="VacacionDetalle" component={GlowPermisoDetalle} />
      <Stack.Screen name="MisIncapacidades" component={GlowIncapacidades} />
      <Stack.Screen name="NuevaIncapacidad" component={GlowNuevaIncapacidad} />
      <Stack.Screen name="IncapacidadDetalle" component={GlowIncapacidadDetalle} />
      <Stack.Screen name="MisExpediente" component={GlowExpediente} />
      <Stack.Screen name="MisExpedienteDocumento" component={GlowExpedienteDocumento} />
      <Stack.Screen name="MisComisiones" component={GlowComisiones} />
    </Stack.Navigator>
  );
}
