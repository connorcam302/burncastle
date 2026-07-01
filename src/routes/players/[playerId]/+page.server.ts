import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	return {
		playerId: params.playerId
	};
};
