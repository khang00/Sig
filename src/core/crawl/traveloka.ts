import axios from "axios";

interface CrawlRequest {
  top: 100,
  skip: 0
}

const toData = (request: CrawlRequest) => JSON.stringify({
  "clientInterface": "desktop",
  "data": {
    "checkInDate": { "year": 2021, "month": 5, "day": 19 },
    "checkOutDate": { "year": 2021, "month": 5, "day": 20 },
    "numOfNights": 1,
    "currency": "VND",
    "numAdults": 2,
    "numChildren": 0,
    "childAges": [],
    "numInfants": 0,
    "numRooms": 1,
    "showHidden": false,
    "basicFilterSortSpec": {
      "ascending": false,
      "basicSortType": "POPULARITY",
      "starRatingFilter": [true, true, true, true, true],
      "top": request.top,
      "skip": request.skip
    },
    "supportedDisplayTypes": ["INVENTORY"]
  },
  "fields": []
});

const header = {
  "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:88.0) Gecko/20100101 Firefox/88.0",
  "Accept": "application/json",
  "Accept-Language": "en-US,en;q=0.5",
  "Referer": "https://www.traveloka.com/vi-vn/hotel/search?spec=19-05-2021.20-05-2021.1.1.HOTEL_GEO.10009794.Th%C3%A0nh%20ph%E1%BB%91%20H%E1%BB%93%20Ch%C3%AD%20Minh%2C%20Vi%E1%BB%87t%20Nam.2",
  "Content-Type": "application/json",
  "x-domain": "accomSearch",
  "x-route-prefix": "vi-vn",
  "x-nonce": "26d5fd28-4f1d-47eb-97a9-41959e5d8df5",
  "Origin": "https://www.traveloka.com",
  "Connection": "keep-alive",
  "Cookie": "tvl=qgdHX7GvehrD9XH5a3S4PdE8AYpuF3hYPaT5bxhY7ZbyjluSjBv/yveVvBLbRH9uhyl1RuiueVvdseP+Z5Ro8fL+88OHn3xnHfGtBjBd5kecYNusBzXx6n+l88dtFmoIDxys2grmYyA0aTxj8wDw3+5/P2EcSKvbw04keQTJNFTvlyHfFnPptZUxAgMVwRNSCMYWUJplNNMY2P4/83O9X+8GNrPf8Ng75ZieUaJama8=; tvs=qgdHX7GvehrD9XH5a3S4PWL3Nd74xArIuT+JzcRMbKddQHovERAJ9HWRLrAaZ0jPhWj5HSxm0ZKiRbldET1ham2PeYg1sQr2h/wIBjIyPQ1JQfOnq9PrXiJXCb7pG+GumNoWYMUApk+29Mh6xs2uXksTzyNBAXpmnvYH6Lj09DKHfeYfhar+r9bi9SzWnJ4q3jW7f6f85zK7XA1xLrLbn3wpMY91AYFzJ6h8za/vSrng40uUoDT+qJIv0oQGNB1A; ak_bmsc=97181004E0AE97F745CD44E721144C8B17DF12966905000021B6A360F7475B0A~plTorMnbJLRIfAA89EpLhz+2RtidylhSVXrdkON2q8ejUhSRHAgQXGhFBl6ZYjRSnSafvQs3ezADujUdilKM3r9tLHNUDVwPDUD9LOdhDfRJY9h1An6xds9fQysWTWpr/IDpxb0m0GrpwKggwejkdSpLSTa8Jxthbs0nAhzwwV/X5eWTKyjDcvdmpWG5gZJUWTo48mv0vxHoU2k96ZhtBEM3hB7ov3hLsZPh+KosWXknilEgp2r3IPFo0K4Dk3XAb3; bm_sz=8942AF1C4A7DA39D72BE1D0E6ABE5077~YAAQlhLfF7Q7xjR5AQAATHF/fwtTF3bzKTie8pNGxyB4R/KTH6PZNvTN+JrHbT9bo6fC4hg1WMuOThKRcJE2LHCKtIcUY4+WmojmBMbRvbcWhnZu+2lsRy8QtUiVRXSyaZ5WgcvjxPI28ofW3FmuznCK+625IhQAHPnu+qIKu9+WFQReiEzF8sE18tpUQ9CvU/zL; _abck=FD844F67659410BCA6EE92415FE84EBB~0~YAAQlhLfF708xjR5AQAAosCBfwXWVB7SNbDmwPVmEZsElq5CRVmMkrapZVgFrUMOgsK+3G7n8eQgEil7US991obrsKuuCePURQdR4xwEdMQFyAoAGFtn30HMkNDX7/VnWXP7EXWXlfZQ4cTFh2ktOdKxPOSsldrnVQkMQz8ZjBDoL/2XB0D/Cm5QwS6QHumYnhbyPVelFc/cWDQoe4wyq0/IYK4ZLcHBnK9vbx5v+b+wOGWJVxi4K1ik+9LUyI6QQKTJLw++0SRtbcZGwxuYUPcpJBDZs3wXfBFs/UO7rSwMYUCg5lE/MMDAd8w+xilAVOQV/8QtV07WDP+jqFvt5Q//llbXhpbIlEi0uQ2diRo5eMQ5JLGWIDrbOgB/sFVslv/hSaiqqhO6r5l1OU7BXFmVQJqQSP6fq+cS~-1~-1~-1; tv-pnheader=1; tv-repeat-visit=true; bm_sv=A9DA06499CB77B1B304E3653C2F04CDF~EOzTwSXf40JacyT0fCdAiv1Nwxo7en1AOD44G0THmUrzhA2yAHmZ0Qc+zob65qSfc7TdWxa2b5hPfBzCVddNd+gfMIN6G0oggjGFvR1Us+V7qrm9NcWY39gefA1lUi+bez1gBBssIyQ5aOyt7kWKXYALGWF1EX9L8vcszyprd2I=; amp_1a5adb=9LD-I5JfWFLgrsMfsVOfZS...1f5vnvb4d.1f5vogjhg.m.0.m; G_ENABLED_IDPS=google; _ga_RSRSMMBH0X=GS1.1.1621341744.1.1.1621342324.0; _ga=GA1.2.2077162785.1621341745; _gid=GA1.2.1573325949.1621341745; occupancyTooltip=1; _gcl_au=1.1.1343554171.1621341767; _fbp=fb.1.1621341766828.276924206; g_state={\"i_p\":1621348973233,\"i_l\":1}; isPriceFinderActive=null; dateIndicator=null; bannerMessage=null; displayPrice=null; hotelSearchLoginModalLastShown=1621341916876; accomSuccessLoginConfirmation=0; hotelSearchCancellationTooltip=1; _gat_UA-29776811-12=1; AWSALB=UMh3y2xdXlXl1VyCrC/c8sKSzp2gTevsbbR6kJ4UnNdU8ccl8GxdyhXLj7hnSM+dZqdVvJXArgVJLZtOyOTH4UmBHWvzZNf+MzSxjLWYueOMoa/cSpbR02PjbRYw; AWSALBCORS=UMh3y2xdXlXl1VyCrC/c8sKSzp2gTevsbbR6kJ4UnNdU8ccl8GxdyhXLj7hnSM+dZqdVvJXArgVJLZtOyOTH4UmBHWvzZNf+MzSxjLWYueOMoa/cSpbR02PjbRYw; tvl=qgdHX7GvehrD9XH5a3S4PdE8AYpuF3hYPaT5bxhY7ZbyjluSjBv/yveVvBLbRH9uj7IFsRj75r8AB1/FM+EYAEQiOGxGngBqmcsilZQ/mLBQNGzKDKhPrarCJ92GqHvZDxys2grmYyA0aTxj8wDw3+5/P2EcSKvbw04keQTJNFTvlyHfFnPptZUxAgMVwRNSCMYWUJplNNMY2P4/83O9X+8GNrPf8Ng75ZieUaJama8=; bm_sv=A9DA06499CB77B1B304E3653C2F04CDF~EOzTwSXf40JacyT0fCdAiv1Nwxo7en1AOD44G0THmUrzhA2yAHmZ0Qc+zob65qSfc7TdWxa2b5hPfBzCVddNd+gfMIN6G0oggjGFvR1Us+U/JYatsfrD8KFIoDzhksgqZ+/SYk7rkMjd+qw/qRzCjcSfvzjoEprYUFgYVsGf6Rs=; _abck=FD844F67659410BCA6EE92415FE84EBB~-1~YAAQlhLfF3BRxjR5AQAAjnagfwW+ZyzHZhAsqNd1QB3GvGF/PTO0DTST6llNUDLD2382y9MhbXO32tTqBKTgmHa7e3y3Xtd9l159NGNuBKwGQ7XQsoU3Z0qZNiB+8LYrA9PVn1t5mEGMq5DPufy7oJFgkMYP/r2LHdrhqdAHqh7vXbYS4cNoXe7SlAV4LEMm31kSYA3FR1UIUyF1sGWoCuZm5ban+u8eB4zhLP7CqBoXw6duvm5r6FLws29ySA48mI6csVC7buy0eFLaXmRAsiQSX6M7FQgYM/WwzTHqthTCofmqOrzz4iDvHVt/yZHaqI0HIvUAe+zZU2RedrATQM8feZ+I+/qwVgxDt8Bs677rEE82X4h6eLJF5e+4/RsmGOgXdEAhPZIC1mRQ1VnFrZJHZ7Rg48y2/0Tw~0~-1~-1"
};

const config = {
  url: "https://www.traveloka.com/api/v2/hotel/searchList",
  method: "post" as "post",
  header: header
};

const axiosCrawler = axios.create(config);
