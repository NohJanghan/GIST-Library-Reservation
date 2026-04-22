export type FacilityRoom = {
  id: number;
  groupId: number;
  reservationByOthers: number[];
  reservationByMe: number[];
};

export type FacilityGroup = {
  id: number;
  name: string;
  floor: number;
  facilities: FacilityRoom[];
  fromTime: number;
  toTime: number;
};

export type CommonFacilityInfo = {
  notAvailableDays: string[];
  reservationCountInDay: number;
  reservationCountInMonth: number;
  reservationLimitInDay: number;
  reservationLimitInMonth: number;
};

export type FacilityResponse = {
  facilityGroup: FacilityGroup[];
  commonFacilityInfo: CommonFacilityInfo;
};
