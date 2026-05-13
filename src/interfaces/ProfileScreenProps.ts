export interface ProfileScreenProps {
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  userRole?: string;
  onChangePhoto?: () => void;
  onEditProfile?: () => void;
}
