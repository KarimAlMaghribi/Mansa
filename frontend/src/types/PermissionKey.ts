import { PermissionKeyEnum } from '../enums/PermissionKey.enum';

export type PermissionKey =
  | PermissionKeyEnum.CREATE_GROUP
  | PermissionKeyEnum.EDIT_GROUP
  | PermissionKeyEnum.DELETE_GROUP
  | PermissionKeyEnum.GENERATE_LINK
  | PermissionKeyEnum.VIEW_INVITES
  | PermissionKeyEnum.REVOKE_INVITE
  | PermissionKeyEnum.APPLY_PUBLIC
  | PermissionKeyEnum.JOIN_VIA_LINK
  | PermissionKeyEnum.VIEW_REQUESTS
  | PermissionKeyEnum.APPROVE_REQUEST
  | PermissionKeyEnum.REJECT_REQUEST
  | PermissionKeyEnum.VIEW_MEMBERS
  | PermissionKeyEnum.ADD_MEMBER
  | PermissionKeyEnum.REMOVE_MEMBER
  | PermissionKeyEnum.CHANGE_ROLE
  | PermissionKeyEnum.SELF_LEAVE;
