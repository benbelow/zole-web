package zole;

import java.util.Comparator;

public class PointsComparator implements Comparator<Card> {

	@Override
	public int compare(Card card1, Card card2) {
		return Integer.compare(card1.points, card2.points);
	}
	

}
