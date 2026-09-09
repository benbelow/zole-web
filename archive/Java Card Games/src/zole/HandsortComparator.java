package zole;

import java.util.Comparator;

public class HandsortComparator implements Comparator<Card>{

	@Override
	public int compare(Card card1, Card card2) {
		return Integer.compare((card2.valuepriority*card2.suitpriority),(card1.valuepriority*card1.suitpriority));

	}

}
