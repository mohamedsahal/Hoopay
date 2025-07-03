import { NavigationContainerRef, CommonActions } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';

let navigator: NavigationContainerRef<RootStackParamList> | null = null;

export const setNavigator = (nav: NavigationContainerRef<RootStackParamList>) => {
  navigator = nav;
};

export const navigate = (name: keyof RootStackParamList, params?: any) => {
  if (navigator) {
    navigator.dispatch(
      CommonActions.navigate({
        name,
        params,
      })
    );
  }
};

export const goBack = () => {
  if (navigator) {
    navigator.dispatch(CommonActions.goBack());
  }
};

// Function to reset navigation to login screen (for session expiry)
export const resetToLogin = () => {
  if (navigator) {
    navigator.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      })
    );
  }
};

export default {
  navigate,
  goBack,
  setNavigator,
  resetToLogin,
}; 