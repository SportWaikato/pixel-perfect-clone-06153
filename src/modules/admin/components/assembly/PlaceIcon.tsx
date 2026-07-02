interface PlaceIconProps {
  place: number;
  accentColor: string;
  size?: number;
}

const PlaceIcon = ({ place, accentColor, size = 64 }: PlaceIconProps) => {
  if (place === 1) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 95 95"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clipPath="url(#clip-1st)">
          <path
            d="M46.849 83.5365C56.1177 83.5365 63.6313 76.0224 63.6313 66.7534C63.6313 57.4844 56.1177 49.9704 46.849 49.9704C37.5804 49.9704 30.0664 57.4844 30.0664 66.7534C30.0664 76.0224 37.5804 83.5365 46.849 83.5365Z"
            stroke="#7EAB9F"
            strokeWidth="3.5625"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M68.7239 76.0391C70.6497 73.4254 71.6813 70.1926 71.6813 66.9598C71.6813 63.727 70.6497 60.4943 68.7239 57.8805C68.1049 59.1186 67.4858 60.4255 66.9355 61.6636"
            stroke="#7EAB9F"
            strokeWidth="3.5625"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M62.7382 79.547L66.9338 79.2719C59.987 94.8168 33.3003 94.7481 26.3535 79.2719L30.5492 79.547"
            stroke="#7EAB9F"
            strokeWidth="3.5625"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M25.0453 76.0391C23.1195 73.4254 22.0879 70.1926 22.0879 66.9598C22.0879 63.727 23.1195 60.4943 25.0453 57.8805C25.6643 59.1186 26.2834 60.4255 26.8337 61.6636"
            stroke="#7EAB9F"
            strokeWidth="3.5625"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M27.3164 55.542C28.2105 52.4467 30.0678 49.6266 32.6815 47.6319C35.2951 45.6372 38.4591 44.4678 41.6917 44.399V39.378"
            stroke="#7EAB9F"
            strokeWidth="3.5625"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M66.4549 55.5418C65.5607 52.4466 63.7035 49.6265 61.0898 47.6318C58.4762 45.6371 55.3122 44.4676 52.0795 44.3989V39.3778H41.694L26.6309 0.721741H39.3552L45.2015 15.6478"
            stroke="#7EAB9F"
            strokeWidth="3.5625"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M43.6875 28.3726L54.4173 0.653076H67.1416L52.0785 39.309"
            stroke="#7EAB9F"
            strokeWidth="3.5625"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M46.8496 59.5312V72.9439"
            stroke="#7EAB9F"
            strokeWidth="3.5625"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M41.5625 61.7512L46.3124 59.3761"
            stroke="#7EAB9F"
            strokeWidth="3.5625"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M43.6875 72.9438H50.0839"
            stroke="#7EAB9F"
            strokeWidth="3.5625"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M57.2358 4.78015L50.9082 21.2192H54.6911L61.0875 4.78015H57.2358Z"
            fill={accentColor}
          />
        </g>
        <defs>
          <clipPath id="clip-1st">
            <rect width="95" height="95" fill="white" />
          </clipPath>
        </defs>
      </svg>
    );
  }

  if (place === 2) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clipPath="url(#clip-2nd)">
          <path
            d="M31.5623 56.2762C37.8065 56.2762 42.8685 51.2141 42.8685 44.9699C42.8685 38.7256 37.8065 33.6637 31.5623 33.6637C25.318 33.6637 20.2559 38.7256 20.2559 44.9699C20.2559 51.2141 25.318 56.2762 31.5623 56.2762Z"
            stroke="#7EAB9F"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M46.2986 51.2254C47.596 49.4646 48.291 47.2867 48.291 45.1089C48.291 42.9311 47.596 40.7532 46.2986 38.9924C45.8815 39.8265 45.4644 40.7069 45.0938 41.541"
            stroke="#7EAB9F"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M42.2661 53.5885L45.0928 53.4032C40.4127 63.8754 22.4339 63.829 17.7539 53.4032L20.5805 53.5885"
            stroke="#7EAB9F"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16.8733 51.2254C15.5758 49.4646 14.8809 47.2867 14.8809 45.1089C14.8809 42.9311 15.5758 40.7532 16.8733 38.9924C17.2903 39.8265 17.7074 40.7069 18.0781 41.541"
            stroke="#7EAB9F"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18.4023 37.417C19.0047 35.3319 20.256 33.4321 22.0168 32.0883C23.7776 30.7445 25.9091 29.9567 28.087 29.9103V26.5278"
            stroke="#7EAB9F"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M44.7707 37.4169C44.1683 35.3318 42.9171 33.432 41.1563 32.0882C39.3955 30.7444 37.2639 29.9566 35.0861 29.9103V26.5277H28.0894L17.9414 0.486237H26.5138L30.4524 10.5415"
            stroke="#7EAB9F"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M29.4316 19.1138L36.6603 0.439972H45.2326L35.0846 26.4814"
            stroke="#7EAB9F"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M38.5597 3.22025L34.2969 14.2948H36.8454L41.1547 3.22025H38.5597Z"
            fill={accentColor}
          />
          <path
            d="M27.7182 50V48.3381L31.6014 44.7425C31.9316 44.4229 32.2086 44.1353 32.4324 43.8796C32.6596 43.6239 32.8319 43.3736 32.949 43.1286C33.0662 42.88 33.1248 42.6119 33.1248 42.3242C33.1248 42.0046 33.052 41.7294 32.9064 41.4986C32.7608 41.2642 32.562 41.0849 32.3098 40.9606C32.0577 40.8327 31.7718 40.7688 31.4522 40.7688C31.1184 40.7688 30.8272 40.8363 30.5787 40.9712C30.3301 41.1062 30.1383 41.2997 30.0034 41.5518C29.8684 41.804 29.801 42.104 29.801 42.4521H27.6117C27.6117 41.7383 27.7733 41.1186 28.0964 40.593C28.4196 40.0675 28.8723 39.6609 29.4547 39.3732C30.0371 39.0856 30.7083 38.9418 31.4682 38.9418C32.2495 38.9418 32.9295 39.0803 33.5083 39.3572C34.0907 39.6307 34.5435 40.0107 34.8667 40.4972C35.1898 40.9837 35.3514 41.5412 35.3514 42.1697C35.3514 42.5817 35.2697 42.9883 35.1064 43.3896C34.9466 43.7908 34.6607 44.2365 34.2488 44.7266C33.8368 45.2131 33.2562 45.7972 32.5069 46.479L30.9142 48.0398V48.1143H35.4952V50H27.7182Z"
            fill="#7EAB9F"
          />
        </g>
        <defs>
          <clipPath id="clip-2nd">
            <rect width="64" height="64" fill="white" />
          </clipPath>
        </defs>
      </svg>
    );
  }

  if (place === 3) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clipPath="url(#clip-3rd)">
          <path
            d="M31.5623 56.2762C37.8065 56.2762 42.8685 51.2141 42.8685 44.9699C42.8685 38.7256 37.8065 33.6637 31.5623 33.6637C25.318 33.6637 20.2559 38.7256 20.2559 44.9699C20.2559 51.2141 25.318 56.2762 31.5623 56.2762Z"
            stroke="#7EAB9F"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M46.2986 51.2254C47.596 49.4646 48.291 47.2867 48.291 45.1089C48.291 42.9311 47.596 40.7532 46.2986 38.9924C45.8815 39.8265 45.4644 40.7069 45.0938 41.541"
            stroke="#7EAB9F"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M42.2661 53.5885L45.0928 53.4032C40.4127 63.8754 22.4339 63.829 17.7539 53.4032L20.5805 53.5885"
            stroke="#7EAB9F"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16.8733 51.2254C15.5758 49.4646 14.8809 47.2867 14.8809 45.1089C14.8809 42.9311 15.5758 40.7532 16.8733 38.9924C17.2903 39.8265 17.7074 40.7069 18.0781 41.541"
            stroke="#7EAB9F"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18.4023 37.417C19.0047 35.3319 20.256 33.4321 22.0168 32.0883C23.7776 30.7445 25.9091 29.9567 28.087 29.9103V26.5278"
            stroke="#7EAB9F"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M44.7707 37.4169C44.1683 35.3318 42.9171 33.432 41.1563 32.0882C39.3955 30.7444 37.2639 29.9566 35.0861 29.9103V26.5277H28.0894L17.9414 0.486237H26.5138L30.4524 10.5415"
            stroke="#7EAB9F"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M29.4316 19.1138L36.6603 0.439972H45.2326L35.0846 26.4814"
            stroke="#7EAB9F"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M38.5597 3.22025L34.2969 14.2948H36.8454L41.1547 3.22025H38.5597Z"
            fill={accentColor}
          />
          <path
            d="M31.7505 50.1491C30.9551 50.1491 30.2466 50.0124 29.6252 49.739C29.0073 49.462 28.519 49.082 28.1603 48.5991C27.8052 48.1126 27.6223 47.5515 27.6117 46.9158H29.9341C29.9483 47.1822 30.0353 47.4165 30.1951 47.619C30.3585 47.8178 30.5751 47.9723 30.845 48.0824C31.1149 48.1925 31.4185 48.2475 31.7559 48.2475C32.1074 48.2475 32.4181 48.1854 32.688 48.0611C32.9579 47.9368 33.1692 47.7646 33.3219 47.5444C33.4746 47.3242 33.551 47.0703 33.551 46.7827C33.551 46.4915 33.4693 46.234 33.3059 46.0103C33.1461 45.783 32.9153 45.6055 32.6135 45.4776C32.3152 45.3498 31.96 45.2859 31.5481 45.2859H30.5307V43.592H31.5481C31.8961 43.592 32.2033 43.5316 32.4696 43.4109C32.7395 43.2901 32.949 43.1232 33.0982 42.9102C33.2473 42.6935 33.3219 42.4414 33.3219 42.1538C33.3219 41.8803 33.2562 41.6406 33.1248 41.4347C32.997 41.2251 32.8159 41.0618 32.5815 40.9446C32.3507 40.8274 32.0808 40.7688 31.7718 40.7688C31.4593 40.7688 31.1735 40.8256 30.9142 40.9393C30.655 41.0494 30.4473 41.2074 30.291 41.4134C30.1348 41.6193 30.0513 41.8608 30.0407 42.1378H27.8301C27.8407 41.5092 28.0201 40.9553 28.3681 40.4759C28.7161 39.9964 29.1848 39.6218 29.7743 39.3519C30.3674 39.0785 31.0368 38.9418 31.7825 38.9418C32.5353 38.9418 33.1941 39.0785 33.7587 39.3519C34.3233 39.6254 34.7619 39.9947 35.0744 40.4599C35.3904 40.9215 35.5467 41.44 35.5431 42.0153C35.5467 42.6261 35.3567 43.1357 34.9732 43.544C34.5932 43.9524 34.0978 44.2116 33.487 44.3217V44.407C34.2896 44.5099 34.9004 44.7887 35.3194 45.2433C35.742 45.6942 35.9515 46.2589 35.948 46.9371C35.9515 47.5586 35.7722 48.1108 35.41 48.5938C35.0513 49.0767 34.5559 49.4567 33.9238 49.7337C33.2917 50.0107 32.5673 50.1491 31.7505 50.1491Z"
            fill="#7EAB9F"
          />
        </g>
        <defs>
          <clipPath id="clip-3rd">
            <rect width="64" height="64" fill="white" />
          </clipPath>
        </defs>
      </svg>
    );
  }

  if (place > 4) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="32" cy="45" r="11.3" stroke="#7EAB9F" strokeWidth="2.4" />
        <text
          x="32"
          y="49.5"
          textAnchor="middle"
          fontSize="13"
          fontWeight="bold"
          fill="#7EAB9F"
          fontFamily="sans-serif"
        >
          {place}
        </text>
        <path
          d="M44.7707 37.4169C44.1683 35.3317 42.9171 33.4319 41.1563 32.0882C39.3955 30.7444 37.2639 29.9566 35.0861 29.9102V26.5277H28.0894L17.9414 0.486206H26.5138L30.4524 10.5414"
          stroke="#7EAB9F"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M29.4316 19.1139L36.6603 0.440002H45.2326L35.0846 26.4814"
          stroke="#7EAB9F"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M38.5597 3.22028L34.2969 14.2948H36.8454L41.1547 3.22028H38.5597Z"
          fill={accentColor}
        />
      </svg>
    );
  }

  // place === 4
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath="url(#clip-4th)">
        <path
          d="M31.5623 56.2761C37.8065 56.2761 42.8685 51.2141 42.8685 44.9698C42.8685 38.7256 37.8065 33.6636 31.5623 33.6636C25.318 33.6636 20.2559 38.7256 20.2559 44.9698C20.2559 51.2141 25.318 56.2761 31.5623 56.2761Z"
          stroke="#7EAB9F"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M46.2986 51.2254C47.596 49.4646 48.291 47.2867 48.291 45.1089C48.291 42.9311 47.596 40.7532 46.2986 38.9924C45.8815 39.8265 45.4644 40.7069 45.0938 41.541"
          stroke="#7EAB9F"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M42.2661 53.5885L45.0928 53.4032C40.4127 63.8754 22.4339 63.829 17.7539 53.4032L20.5805 53.5885"
          stroke="#7EAB9F"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16.8733 51.2254C15.5758 49.4646 14.8809 47.2867 14.8809 45.1089C14.8809 42.9311 15.5758 40.7532 16.8733 38.9924C17.2903 39.8265 17.7074 40.7069 18.0781 41.541"
          stroke="#7EAB9F"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M18.4023 37.417C19.0047 35.3319 20.256 33.4321 22.0168 32.0883C23.7776 30.7445 25.9091 29.9567 28.087 29.9103V26.5278"
          stroke="#7EAB9F"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M44.7707 37.4169C44.1683 35.3317 42.9171 33.4319 41.1563 32.0882C39.3955 30.7444 37.2639 29.9566 35.0861 29.9102V26.5277H28.0894L17.9414 0.486206H26.5138L30.4524 10.5414"
          stroke="#7EAB9F"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M29.4316 19.1139L36.6603 0.440002H45.2326L35.0846 26.4814"
          stroke="#7EAB9F"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M38.5597 3.22028L34.2969 14.2948H36.8454L41.1547 3.22028H38.5597Z"
          fill={accentColor}
        />
        <path
          d="M27.5531 48.0824V46.266L32.1074 39.0909H33.6735V41.6051H32.7466L29.8755 46.1488V46.234H36.3475V48.0824H27.5531ZM32.7892 50V47.5284L32.8319 46.7241V39.0909H34.9945V50H32.7892Z"
          fill="#7EAB9F"
        />
      </g>
      <defs>
        <clipPath id="clip-4th">
          <rect width="64" height="64" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default PlaceIcon;
