import { createNativeStackNavigator } from "@react-navigation/native-stack";
import UserProfileTabScreen from "../../pages/profile/UserProfileTabScreen";
import MisRegistrosScreen from "../../pages/profile/MisRegistrosScreen";
import MisPermisosScreen from "../../pages/profile/MisPermisosScreen";
import NuevoPermisoScreen from "../../pages/profile/NuevoPermisoScreen";
import PermisoDetalleScreen from "../../pages/profile/PermisoDetalleScreen";
import MisIncapacidadesScreen from "../../pages/profile/MisIncapacidadesScreen";
import NuevaIncapacidadScreen from "../../pages/profile/NuevaIncapacidadScreen";
import IncapacidadDetalleScreen from "../../pages/profile/IncapacidadDetalleScreen";
import MisExpedienteScreen from "../../pages/profile/MisExpedienteScreen";
import MisExpedienteDocumentoScreen from "../../pages/profile/MisExpedienteDocumentoScreen";

const Stack = createNativeStackNavigator();

export default function UserProfileNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="UserProfileMain" component={UserProfileTabScreen} />
      <Stack.Screen name="MisRegistros" component={MisRegistrosScreen} />
      <Stack.Screen name="MisPermisos" component={MisPermisosScreen} />
      <Stack.Screen name="NuevoPermiso" component={NuevoPermisoScreen} />
      <Stack.Screen name="PermisoDetalle" component={PermisoDetalleScreen} />
      <Stack.Screen name="MisIncapacidades" component={MisIncapacidadesScreen} />
      <Stack.Screen name="NuevaIncapacidad" component={NuevaIncapacidadScreen} />
      <Stack.Screen name="IncapacidadDetalle" component={IncapacidadDetalleScreen} />
      <Stack.Screen name="MisExpediente" component={MisExpedienteScreen} />
      <Stack.Screen name="MisExpedienteDocumento" component={MisExpedienteDocumentoScreen} />
    </Stack.Navigator>
  );
}
